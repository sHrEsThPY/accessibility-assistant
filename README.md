# Accessibility Assistant for Simple-Language Explanations
### An AI-Powered Text Simplification System

> **AI-powered tool that turns complex legal, medical, and technical documents into plain, easy-to-understand language — in seconds.**

[![React](https://img.shields.io/badge/Frontend-React%20%7C%20Vite%20%7C%20Tailwind%20v4-61DAFB?logo=react)](https://frontend-nine-ashen-85.vercel.app)
[![Flask](https://img.shields.io/badge/Backend-Flask%203%20%7C%20Python-4EA94B?logo=flask)](https://accessibility-assistant-api-dz55.onrender.com/health)
[![Groq](https://img.shields.io/badge/LLM-Groq%20Llama%203-F55036?logo=groq)](https://groq.com)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?logo=vercel)](https://frontend-nine-ashen-85.vercel.app)
[![Render](https://img.shields.io/badge/Deployed-Render-46E3B7?logo=render)](https://accessibility-assistant-api-dz55.onrender.com)

---

## 🏛️ Project Details & Team Information

**Institution:** Kalasalingam Academy of Research and Education  
**Project Title:** Accessibility Assistant for Simple-Language Explanations  
**Subtitle:** An AI-Powered Text Simplification System  
**Project ID:** `PRJ064`  
**Team ID:** `T064`  
**GitHub Repository:** [github.com/sHrEsThPY/accessibility-assistant](https://github.com/sHrEsThPY/accessibility-assistant)  
**Project Trainer / Guide:** Mr. SHIRWIN PRINCE I  

### 👥 Team Members

| Student Name | Registration Number | Individual GitHub Profile |
| :--- | :--- | :--- |
| **Rishi Kumar** | `99230041223` | [@R1shiii](https://github.com/R1shiii) |
| **Shresth Kumar** | `99230041224` | [@sHrEsThPY](https://github.com/sHrEsThPY) |
| **Vinayak Bhardwaj** | `99230041226` | [@ViNuCodeCrafter](https://github.com/ViNuCodeCrafter) |
| **Shivam Kumar** | `99230041218` | [@shivamkr2312](https://github.com/shivamkr2312) |
| **Rohit Kumar** | `99230041216` | [@Rohitgupta9334](https://github.com/Rohitgupta9334) |

---

## 🌐 Live Deployments

- **Live Application (Frontend):** [https://frontend-nine-ashen-85.vercel.app](https://frontend-nine-ashen-85.vercel.app)
- **Live API Service (Backend):** [https://accessibility-assistant-api-dz55.onrender.com](https://accessibility-assistant-api-dz55.onrender.com)
- **API Health Check:** [https://accessibility-assistant-api-dz55.onrender.com/health](https://accessibility-assistant-api-dz55.onrender.com/health)

---

## 📑 Official Project Report Document

```
================================================================================
Kalasalingam Academy of Research and Education
Accessibility Assistant for Simple-Language Explanations
An AI-Powered Text Simplification System
Project ID: PRJ064 | Team ID: T064
================================================================================
```

### Table of Contents
1. [Section 1: Introduction](#1-introduction)
2. [Section 2: Problem Statement & Objectives](#2-problem-statement--objectives)
3. [Section 3: System Architecture (Processing Pipeline)](#3-system-architecture-processing-pipeline)
4. [Section 4: Implementation Details & Tech Stack](#4-implementation-details--tech-stack)
5. [Section 5: Results and Testing](#5-results-and-testing)
6. [Section 6: Conclusion & Future Scope](#6-conclusion--future-scope)

---

### 1. Introduction
Digital information is increasingly dense, technical, and written in complex language. Legal notices, government circulars, insurance policies, medical instructions, academic papers, and software documentation are frequently written for specialists rather than for the general public. As a result, they are difficult to understand for people with cognitive or learning disabilities (such as dyslexia or attention-related difficulties), for non-native speakers, for first-generation learners, for older adults, and for anyone encountering unfamiliar jargon. Plain-language access is a core part of digital accessibility and is recognised in guidelines such as the Web Content Accessibility Guidelines (WCAG), yet the vast majority of online and institutional content is never rewritten for easier reading.

Large Language Models (LLMs) are capable of rephrasing and explaining text, but when used without careful control they may oversimplify, omit important conditions or numbers, change the meaning of a sentence, or introduce inaccuracies that were never in the source. They also do not guarantee a consistent reading level from one response to the next. This project implements an **Accessibility Assistant** that takes complex text from the user, either pasted directly or extracted from an uploaded document, and produces clear, simple-language explanations at an adjustable reading level. The system combines a structured prompt, objective readability measurement, and an automatic re-simplification step so that the output is both easy to read and faithful to the original meaning.

The assistant is designed with accessibility in mind at every layer. Besides the simplified text itself, it provides a glossary that explains difficult terms in context, a short summary of the main points, and an optional audio version of the result. The interface uses large readable fonts, high contrast, clear labels, and a simple layout so that it can be used comfortably with screen readers and keyboard navigation.

---

### 2. Problem Statement & Objectives

#### Problem
Students, citizens, and patients regularly need to understand official documents, study material, and technical content, but they are slowed down or completely blocked by long sentences, passive constructions, specialised vocabulary, and dense paragraph structure. A person reading a scholarship notice, a loan agreement, or a prescription leaflet may misunderstand a condition or deadline and suffer a real consequence as a result. Existing tools do not fully solve this: dictionary lookups explain single words without context, translation tools change the language but not the difficulty, and general-purpose chatbots do not guarantee a consistent reading level or faithfulness to the source text. Manual rewriting by experts is accurate but slow, expensive, and impractical at scale.

#### Objectives
- **Fidelity & Precision:** To develop an AI assistant that converts complex text into simple, easy-to-read explanations while keeping every important fact, number, date, and condition from the original.
- **Adjustable Reading Level:** To let users choose the target reading level (basic, intermediate, or standard) and to verify the result objectively using readability scores such as Flesch Reading Ease.
- **Contextual Aids:** To explain difficult terms in context through an automatically generated glossary, and to provide a short step-by-step summary of the key points for quick understanding.
- **Universal Accessibility:** To support accessibility features such as text-to-speech output and a clean, high-contrast, screen-reader-friendly interface that works for users with different needs.
- **Hallucination Prevention:** To reduce loss of meaning and hallucination by instructing the model to stay faithful to the source text, avoid guessing, and clearly flag content that is ambiguous or uncertain.
- **Scalable Document Handling:** To handle long documents reliably by splitting them into segments and processing each one without losing overall context.

**Scope:** The system works on English text in the current version. It is intended as a reading aid and does not replace professional legal, medical, or financial advice; the original text remains the authoritative version.

---

### 3. System Architecture (Processing Pipeline)

The architecture of the application is divided into two primary phases: **Input Processing** and **Simplification & Delivery**. Separating the phases keeps each part of the system simple to build, test, and improve independently. For example, the document parser can be upgraded without touching the prompt logic, and the language model can be replaced without changing the interface.

```
┌────────────────────────────────────────────────────────┐
│               Input Processing Phase                   │
│  [User Text / PDF / DOCX] ──> [Cleaning & Chunking]    │
│  ──> [Baseline Readability Scoring (Flesch Ease)]      │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│            Simplification & Delivery Phase             │
│  [Target Level Prompt] ──> [Groq Llama 3 LLM]          │
│  ──> [Flesch Verification & Multi-Pass Loop]           │
│  ──> [Simplified Output + Glossary + Key Summary]      │
└────────────────────────────────────────────────────────┘
```

#### 3.1 Input Processing Phase
The user pastes text into the interface or uploads a document (PDF or DOCX/TXT file). The input is cleaned by removing page numbers, repeated headers and footers, broken line wraps, and unusual whitespace that commonly appear when text is extracted from PDFs. The cleaned text is then split into manageable segments, for example paragraphs of about 500 tokens, so that long documents can be processed without exceeding the model's context window and without losing the logical flow between sections. Splitting is done at paragraph and sentence boundaries wherever possible so that a sentence is never cut in the middle.

Before any simplification is performed, the original text is analysed with readability metrics such as the Flesch Reading Ease score and the average sentence length. This establishes a baseline difficulty level for the document, lets the interface show the user how complex the original is, and gives the system an objective measure against which to judge the improvement achieved later.

#### 3.2 Simplification & Delivery Phase
Each segment is combined with a carefully designed system prompt that contains the target reading level, formatting rules, and fidelity constraints, and is sent to the Large Language Model. The model generates three outputs for every segment: a simplified explanation written in short sentences and common words, a short glossary that explains any technical terms in plain language, and a brief summary of the key points. The prompt explicitly instructs the model to keep all facts, names, dates, and numbers unchanged and to say so when something in the source is unclear instead of guessing.

After generation, the output is re-scored for readability. If the score is still below the requested level, the text is automatically sent back to the model for another simplification pass, up to a fixed maximum number of passes to avoid endless loops. The segments are then joined in their original order, and the final result is displayed in the interface alongside the original text for easy comparison. The user can optionally listen to the simplified text through text-to-speech and can copy or download the result.

#### Overall Flow Steps
- **Step 1 - Input:** The user pastes text or uploads a PDF/DOCX file and selects the target reading level.
- **Step 2 - Cleaning and segmentation:** The text is cleaned and split into paragraph-sized segments.
- **Step 3 - Baseline scoring:** Readability of the original text is measured and recorded.
- **Step 4 - LLM simplification:** Each segment is simplified, with a glossary and summary produced.
- **Step 5 - Verification:** The result is re-scored and re-simplified if it is still too difficult.
- **Step 6 - Delivery:** The final text is shown with optional audio playback and download.

---

### 4. Implementation Details & Tech Stack

The application is implemented as a Python backend with a high-performance modern web interface.

| Component | Technology Used | Purpose |
| :--- | :--- | :--- |
| **Programming Language** | Python 3.10 / 3.11 | Core backend logic, pipeline control and glue code |
| **Backend Framework** | Flask 3 & Gunicorn | REST API serving endpoints with CORS support |
| **User Interface** | React 19, Vite 8, Tailwind CSS v4 | Accessible web interface with dark UI, high contrast, WCAG compliance |
| **Authentication** | Google Identity Services (GIS), GitHub OAuth & JWT | Real sign-in / sign-up authentication and session handling |
| **Large Language Model** | Llama 3 / open LLMs via Groq API | Generating simplified explanations, glossaries and summaries with sub-second latency |
| **Document Parsing** | PyPDF2 & python-docx | Extracting text from uploaded PDF and Word documents |
| **Readability Analysis** | textstat | Measuring reading level before and after simplification |
| **Text-to-Speech** | Web Speech API / gTTS | Converting simplified text into audio output |

#### 4.1 Sample Prompt & Readability Configuration
To keep the output consistent and faithful, a fixed system prompt and target readability thresholds are used:

```python
SYSTEM_PROMPT = """You are an accessibility assistant.
Rewrite the text for a reader at {level} level.
- Use short sentences and common words.
- Keep every fact and number from the original.
- Explain any technical term in brackets.
- If something is unclear, say so instead of guessing."""

TARGET_FRE = {"basic": 80, "intermediate": 65, "standard": 50}
MAX_PASSES = 2  # re-simplify if score is below target
```

The target scores follow the Flesch Reading Ease scale, where a higher number means easier text: a score near 80 corresponds to very easy, conversational English, while a score near 50 corresponds to fairly standard prose. The maximum number of passes limits how many times a segment may be re-simplified.

#### 4.2 Module Overview
- **Input module:** accepts pasted text or uploaded files, extracts text with PyPDF/python-docx, and removes extraction noise.
- **Segmentation module:** splits long text into paragraph-sized chunks at natural sentence boundaries.
- **Prompt and LLM module:** builds the level-specific prompt and calls Llama 3 through the Groq API, handling errors and retries.
- **Readability module:** computes Flesch Reading Ease and sentence-length statistics with textstat and decides whether another pass is needed.
- **Output module:** assembles the simplified text, glossary and summary, and produces audio playback.
- **Interface module:** modern React front end with large fonts, high contrast, clear labels, keyboard-friendly controls, and aesthetic design.

#### 4.3 Accessibility Considerations
Because the tool is meant for people who may find reading difficult, the interface itself follows accessibility practices:
- Text is displayed in large, legible typography with generous line spacing.
- Color contrast meets WCAG AAA/AA standards on dark surfaces.
- Every control has explicit ARIA labels for screen readers.
- Important results are never conveyed by color alone.
- Full keyboard navigation support (tabs, focus indicators, escape handlers).
- Audio speech output provides an equal way to access content for visually impaired users.

---

### 5. Results and Testing
The system was tested on a set of sample passages drawn from different domains, including academic guidelines, government notices, medical leaflets, and technical documentation:
- **Readability improvement:** The Flesch Reading Ease score and average sentence length were measured before and after simplification to confirm that the text became significantly easier to read.
- **Meaning preservation:** Manual comparison confirmed that key facts, numbers, dates, and obligations were strictly retained without hallucination.
- **Response time:** Sub-second to 3-second completion times achieved using Groq's high-speed inference.
- **Edge cases covered:** Short queries, long multi-page documents, noisy scanned PDFs, already-simple texts, and dense legal clauses.

---

### 6. Conclusion & Future Scope

#### Conclusion
The developed Accessibility Assistant demonstrates that LLMs, when guided by structured prompts and checked with objective readability metrics, can make complex text understandable to a much wider audience. By combining document parsing, level-controlled simplification, glossary generation, and audio output, the system turns difficult content into accessible information. The two-phase pipeline, the readability feedback loop, and the strict fidelity instructions together help balance the two competing goals of simplicity and accuracy. The project also shows that a useful accessibility tool can be built with freely available libraries and a fast hosted model, making the approach practical for educational institutions and community organisations.

#### Future Scope
- **Multilingual simplification:** Expanding to Indian regional languages (Hindi, Tamil, Telugu, etc.) so users can read explanations in their native language.
- **Image and chart description:** Adding multimodal analysis for diagrams, figures, and charts for visually impaired users.
- **Browser extension:** Allowing in-place webpage simplification without copy-pasting.
- **Fact-consistency check:** Automated programmatic entity and number verification between source and output.

---

## 🛠️ Local Development Setup

### 1. Backend Setup
```bash
cd backend
cp .env.example .env      # Add your GROQ_API_KEY
python -m venv .venv
source .venv/bin/activate  # On Windows: .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py              # Server runs at http://localhost:5000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev                # Application runs at http://localhost:5173
```

---

## 📄 License
This project is developed for academic and social-accessibility purposes under the Kalasalingam Academy of Research and Education curriculum.
