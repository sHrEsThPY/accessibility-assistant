"""
Accessibility Assistant — Flask Backend
Powered by Groq (Llama 3) for fast, reliable text simplification
"""

import os
import io
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from groq import Groq

import PyPDF2
from docx import Document

# ─────────────────────────────────────────────
# App Initialisation
# ─────────────────────────────────────────────
load_dotenv()

app = Flask(__name__)

# CORS — allow all origins (tighten after deployment)
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
# Groq Client Configuration
# ─────────────────────────────────────────────
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

if not GROQ_API_KEY:
    logger.warning(
        "GROQ_API_KEY environment variable is not set. "
        "API calls will fail until it is configured."
    )
    groq_client = None
else:
    groq_client = Groq(api_key=GROQ_API_KEY)
    logger.info("Groq client initialised successfully.")


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

# Maximum characters we'll send to Groq in one request
MAX_INPUT_CHARS = 30_000

# Groq model — try in order until one works
GROQ_MODELS = [
    "llama3-8b-8192",
    "llama3-70b-8192",
    "mixtral-8x7b-32768",
    "gemma2-9b-it",
    "gemma-7b-it",
]
GROQ_MODEL = GROQ_MODELS[0]  # default shown in health check



def build_groq_response(text: str, level: str) -> str:
    """
    Send `text` to Groq (Llama 3) with the appropriate system prompt
    and return the simplified response string.

    Raises:
        ValueError: For invalid input.
        RuntimeError: For Groq API failures.
    """
    if not groq_client:
        raise RuntimeError(
            "GROQ_API_KEY is not configured on the server. "
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

    logger.info("Sending request to Groq | level=%s | input_length=%d", level, len(text))

    last_err = None
    for model_name in GROQ_MODELS:
        try:
            completion = groq_client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": text},
                ],
                temperature=0.2,
                max_tokens=2048,
                top_p=0.8,
            )

            result_text = completion.choices[0].message.content

            if not result_text or not result_text.strip():
                raise RuntimeError("Groq returned an empty response. Please try again.")

            logger.info("Groq responded via %s | output_length=%d", model_name, len(result_text))
            return result_text.strip()

        except Exception as exc:
            err_str = str(exc)
            if "model_not_found" in err_str or "does not exist" in err_str or "404" in err_str:
                logger.warning("Model %s not available, trying next. Error: %s", model_name, exc)
                last_err = exc
                continue
            # Non-model error — raise immediately
            logger.exception("Groq API call failed on model %s: %s", model_name, exc)
            raise RuntimeError(f"AI API error: {str(exc)}") from exc

    # All models exhausted
    raise RuntimeError(f"No Groq models available. Last error: {last_err}")



# ─────────────────────────────────────────────
# Endpoint: POST /simplify-text
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

        simplified = build_groq_response(text, level)

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
        logger.error("Runtime error in /simplify-text: %s", exc)
        return jsonify({"error": str(exc)}), 503

    except Exception as exc:
        logger.exception("Unexpected error in /simplify-text")
        return jsonify({"error": "An unexpected server error occurred. Please try again."}), 500


# ─────────────────────────────────────────────
# PDF Text Extractor
# ─────────────────────────────────────────────
def extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))

        if reader.is_encrypted:
            raise ValueError(
                "This PDF is password-protected. "
                "Please remove the password before uploading."
            )

        pages_text = []
        for i, page in enumerate(reader.pages):
            page_text = page.extract_text() or ""
            pages_text.append(page_text)
            if sum(len(t) for t in pages_text) > MAX_INPUT_CHARS:
                logger.info("PDF truncated at page %d to stay within char limit.", i + 1)
                break

        full_text = "\n".join(pages_text).strip()

        if not full_text:
            raise ValueError(
                "Could not extract text from this PDF. "
                "It may be a scanned image-only PDF. "
                "Please try a text-based PDF."
            )

        return full_text[:MAX_INPUT_CHARS]

    except ValueError:
        raise
    except Exception as exc:
        raise RuntimeError(f"Failed to read PDF: {str(exc)}") from exc


# ─────────────────────────────────────────────
# DOCX Text Extractor
# ─────────────────────────────────────────────
def extract_text_from_docx(file_bytes: bytes) -> str:
    try:
        doc = Document(io.BytesIO(file_bytes))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        full_text = "\n".join(paragraphs).strip()

        if not full_text:
            raise ValueError(
                "The Word document appears to be empty or contains no readable text."
            )

        return full_text[:MAX_INPUT_CHARS]

    except ValueError:
        raise
    except Exception as exc:
        raise RuntimeError(f"Failed to read Word document: {str(exc)}") from exc


# ─────────────────────────────────────────────
# Endpoint: POST /upload-document
# ─────────────────────────────────────────────
MAX_FILE_SIZE_MB = 10
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

ALLOWED_EXTENSIONS = {".pdf", ".docx"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "application/octet-stream",
}


@app.route("/upload-document", methods=["POST"])
def upload_document():
    """
    Accept: multipart/form-data with:
      - file: the document (.pdf or .docx)
      - level: simplification level (child|adult|bullet)

    Returns: same format as /simplify-text
    """
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded. Please include a 'file' field."}), 400

        uploaded_file = request.files["file"]
        level = request.form.get("level", DEFAULT_LEVEL)

        if not uploaded_file.filename:
            return jsonify({"error": "Uploaded file has no filename."}), 400

        filename = uploaded_file.filename.lower()
        _, ext = os.path.splitext(filename)

        if ext not in ALLOWED_EXTENSIONS:
            return jsonify({
                "error": f"Unsupported file type '{ext}'. "
                         f"Please upload a .pdf or .docx file."
            }), 422

        file_bytes = uploaded_file.read()

        if len(file_bytes) > MAX_FILE_SIZE_BYTES:
            return jsonify({
                "error": f"File is too large ({len(file_bytes) / 1024 / 1024:.1f} MB). "
                         f"Maximum allowed size is {MAX_FILE_SIZE_MB} MB."
            }), 422

        if len(file_bytes) == 0:
            return jsonify({"error": "Uploaded file is empty."}), 422

        logger.info(
            "Document upload | filename=%s | ext=%s | size=%d bytes | level=%s",
            uploaded_file.filename, ext, len(file_bytes), level
        )

        # Extract text
        if ext == ".pdf":
            extracted_text = extract_text_from_pdf(file_bytes)
        elif ext == ".docx":
            extracted_text = extract_text_from_docx(file_bytes)
        else:
            return jsonify({"error": "Unsupported file type."}), 422

        logger.info("Extracted %d characters from document.", len(extracted_text))

        # Simplify the extracted text
        simplified = build_groq_response(extracted_text, level)

        return jsonify({
            "simplified": simplified,
            "level": level,
            "original_length": len(extracted_text),
            "simplified_length": len(simplified),
            "filename": uploaded_file.filename,
        }), 200

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
        "ai_provider": "groq",
        "model": GROQ_MODEL,
        "groq_configured": bool(GROQ_API_KEY),
    }), 200


# ─────────────────────────────────────────────
# Entry Point (local dev only — Gunicorn bypasses this)
# ─────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
