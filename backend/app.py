"""
Accessibility Assistant — Flask Backend
Phases 1 & 2: Core API + Document Parsing Engine
"""

import os
import io
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

import google.generativeai as genai
import PyPDF2
from docx import Document

# ─────────────────────────────────────────────
# App Initialisation
# ─────────────────────────────────────────────
load_dotenv()

app = Flask(__name__)

# Allow requests from Vite dev-server and production frontend
_FRONTEND_URL = os.environ.get("FRONTEND_URL", "*")
_ORIGINS = "*" if _FRONTEND_URL in ("*", "") else [
    "http://localhost:5173",
    "http://localhost:3000",
    _FRONTEND_URL,
]
CORS(app, resources={r"/*": {"origins": _ORIGINS}}, supports_credentials=False)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────
# Gemini SDK Configuration
# ─────────────────────────────────────────────
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    logger.warning(
        "GEMINI_API_KEY environment variable is not set. "
        "API calls will fail until it is configured."
    )
else:
    genai.configure(api_key=GEMINI_API_KEY)
    logger.info("Gemini API configured successfully.")


# ─────────────────────────────────────────────
# System Prompt Builder
# ─────────────────────────────────────────────
LEVEL_PROMPTS = {
    "child": (
        "You are a friendly teacher explaining things to a 10-year-old child. "
        "Use simple, everyday words. Avoid jargon completely. "
        "Use short sentences (max 15 words each). "
        "If there are numbers or dates, explain what they mean. "
        "Use an encouraging, warm tone. "
        "Begin with: 'Here's what this means in simple words:'"
    ),
    "adult": (
        "You are a clear and helpful communicator explaining a document to a general adult audience. "
        "Use plain English. Replace legal, medical, or technical jargon with everyday equivalents. "
        "Keep sentences under 25 words. Maintain accuracy — do not omit key facts. "
        "Use a neutral, professional yet approachable tone. "
        "Begin with: 'Here's a plain-language summary:'"
    ),
    "bullet": (
        "You are an expert summarizer. Convert the provided text into a concise bullet-point list. "
        "Each bullet must: start with a bold keyword, be one sentence, and use plain English. "
        "Group related points under short sub-headings if appropriate. "
        "Do not add information not present in the original text. "
        "Begin with: '**Key Points:**'"
    ),
}

DEFAULT_LEVEL = "adult"
ALLOWED_LEVELS = set(LEVEL_PROMPTS.keys())

# Maximum characters we'll send to Gemini in one request
MAX_INPUT_CHARS = 30_000


def build_gemini_response(text: str, level: str) -> str:
    """
    Send `text` to Gemini 1.5 Flash with the appropriate system prompt
    and return the simplified response string.

    Raises:
        ValueError: For invalid input.
        RuntimeError: For Gemini API failures.
    """
    if not GEMINI_API_KEY:
        raise RuntimeError(
            "GEMINI_API_KEY is not configured on the server. "
            "Please contact the administrator."
        )

    level = level.strip().lower() if level else DEFAULT_LEVEL
    if level not in ALLOWED_LEVELS:
        raise ValueError(
            f"Invalid level '{level}'. Must be one of: {', '.join(ALLOWED_LEVELS)}."
        )

    text = text.strip()
    if not text:
        raise ValueError("Input text cannot be empty.")

    if len(text) > MAX_INPUT_CHARS:
        raise ValueError(
            f"Input text is too long ({len(text):,} chars). "
            f"Maximum allowed is {MAX_INPUT_CHARS:,} characters."
        )

    system_prompt = LEVEL_PROMPTS[level]

    # Generation config — low temperature keeps output factual and stable
    generation_config = genai.types.GenerationConfig(
        temperature=0.2,
        max_output_tokens=2048,
        top_p=0.8,
        top_k=40,
    )

    model = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        generation_config=generation_config,
        system_instruction=system_prompt,
    )

    logger.info("Sending request to Gemini | level=%s | input_length=%d", level, len(text))

    response = model.generate_content(text)

    if not response or not response.text:
        raise RuntimeError(
            "Gemini returned an empty response. The content may have been blocked "
            "by safety filters. Please try different text."
        )

    logger.info("Gemini responded successfully | output_length=%d", len(response.text))
    return response.text


# ─────────────────────────────────────────────
# Phase 1 — Endpoint: /simplify-text
# ─────────────────────────────────────────────
@app.route("/simplify-text", methods=["POST"])
def simplify_text():
    """
    Accept JSON: {"text": "...", "level": "child|adult|bullet"}
    Return JSON: {"simplified": "...", "level": "...", "original_length": N, "simplified_length": N}
    """
    try:
        payload = request.get_json(silent=True)

        if not payload:
            return jsonify({"error": "Request body must be valid JSON."}), 400

        text = payload.get("text", "")
        level = payload.get("level", DEFAULT_LEVEL)

        simplified = build_gemini_response(text, level)

        return jsonify({
            "simplified": simplified,
            "level": level,
            "original_length": len(text),
            "simplified_length": len(simplified),
        }), 200

    except ValueError as exc:
        logger.warning("Validation error: %s", exc)
        return jsonify({"error": str(exc)}), 422

    except RuntimeError as exc:
        logger.error("Runtime error: %s", exc)
        return jsonify({"error": str(exc)}), 503

    except Exception as exc:
        logger.exception("Unexpected error in /simplify-text")
        return jsonify({"error": "An unexpected server error occurred. Please try again."}), 500


# ─────────────────────────────────────────────
# Phase 2 — Document Parsing Helpers
# ─────────────────────────────────────────────
ALLOWED_EXTENSIONS = {"pdf", "docx"}
MAX_FILE_BYTES = 10 * 1024 * 1024  # 10 MB cap


def allowed_file(filename: str) -> bool:
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS
    )


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extract all text from a PDF byte stream using PyPDF2.
    Raises ValueError if the PDF is encrypted or empty.
    """
    reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))

    if reader.is_encrypted:
        raise ValueError(
            "This PDF is password-protected. Please provide an unlocked version."
        )

    pages_text = []
    for page_num, page in enumerate(reader.pages, start=1):
        try:
            page_text = page.extract_text() or ""
            pages_text.append(page_text)
        except Exception as exc:
            logger.warning("Could not extract page %d: %s", page_num, exc)
            pages_text.append("")  # Gracefully skip bad pages

    combined = "\n\n".join(pages_text).strip()

    if not combined:
        raise ValueError(
            "No readable text was found in this PDF. "
            "It may be a scanned image-only document. "
            "Please use a text-based PDF or copy-paste the text manually."
        )

    return combined


def extract_text_from_docx(file_bytes: bytes) -> str:
    """
    Extract all paragraph text from a .docx file using python-docx.
    """
    doc = Document(io.BytesIO(file_bytes))
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]

    if not paragraphs:
        raise ValueError(
            "No readable text was found in this Word document. "
            "It may contain only images or unsupported content."
        )

    return "\n\n".join(paragraphs)


# ─────────────────────────────────────────────
# Phase 2 — Endpoint: /upload-document
# ─────────────────────────────────────────────
@app.route("/upload-document", methods=["POST"])
def upload_document():
    """
    Accept multipart/form-data with:
      - file: .pdf or .docx
      - level: child|adult|bullet (form field, optional)
    Return same JSON shape as /simplify-text plus "filename" and "page_count".
    """
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file was attached. Please upload a PDF or DOCX."}), 400

        uploaded_file = request.files["file"]
        level = request.form.get("level", DEFAULT_LEVEL)

        if not uploaded_file.filename:
            return jsonify({"error": "File name is empty. Please re-upload the document."}), 400

        if not allowed_file(uploaded_file.filename):
            return jsonify({
                "error": f"Unsupported file type. Please upload a .pdf or .docx file."
            }), 415

        file_bytes = uploaded_file.read()
        file_size = len(file_bytes)

        if file_size == 0:
            return jsonify({"error": "The uploaded file is empty."}), 400

        if file_size > MAX_FILE_BYTES:
            return jsonify({
                "error": f"File is too large ({file_size / 1024 / 1024:.1f} MB). "
                         f"Maximum allowed size is 10 MB."
            }), 413

        extension = uploaded_file.filename.rsplit(".", 1)[1].lower()
        filename = uploaded_file.filename

        logger.info(
            "Document upload | filename=%s | size=%d bytes | level=%s",
            filename, file_size, level
        )

        # Extract raw text based on file type
        if extension == "pdf":
            raw_text = extract_text_from_pdf(file_bytes)
            # Estimate page count
            reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
            page_count = len(reader.pages)
        else:  # docx
            raw_text = extract_text_from_docx(file_bytes)
            page_count = None  # DOCX doesn't have fixed pages

        # Truncate if needed (with notice)
        truncated = False
        if len(raw_text) > MAX_INPUT_CHARS:
            raw_text = raw_text[:MAX_INPUT_CHARS]
            truncated = True
            logger.warning("Document text truncated to %d chars for %s", MAX_INPUT_CHARS, filename)

        simplified = build_gemini_response(raw_text, level)

        response_data = {
            "simplified": simplified,
            "level": level,
            "filename": filename,
            "original_length": len(raw_text),
            "simplified_length": len(simplified),
            "truncated": truncated,
        }
        if page_count is not None:
            response_data["page_count"] = page_count

        return jsonify(response_data), 200

    except ValueError as exc:
        logger.warning("Document validation error: %s", exc)
        return jsonify({"error": str(exc)}), 422

    except RuntimeError as exc:
        logger.error("Document runtime error: %s", exc)
        return jsonify({"error": str(exc)}), 503

    except Exception as exc:
        logger.exception("Unexpected error in /upload-document")
        return jsonify({"error": "An unexpected server error occurred. Please try again."}), 500


# ─────────────────────────────────────────────
# Health Check
# ─────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    """Used by Render health checks and frontend connectivity tests."""
    return jsonify({
        "status": "ok",
        "gemini_configured": bool(GEMINI_API_KEY),
    }), 200


# ─────────────────────────────────────────────
# Entry Point (local dev only — Gunicorn bypasses this)
# ─────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
