# Accessibility Assistant for Simple-Language Explanations

> **AI-powered tool that turns complex legal, medical, and technical documents into plain, easy-to-understand language — in seconds.**

![Tech Stack](https://img.shields.io/badge/React-Vite-blue?logo=react) ![Flask](https://img.shields.io/badge/Flask-Python-green?logo=python) ![Groq](https://img.shields.io/badge/Groq-Llama%203.1-orange)

---

## ✨ Features

- **Three reading levels** — Child-Friendly (age 8–12), General Adult (plain English), Bullet Points
- **Paste text directly** — from any source
- **Upload documents** — `.pdf` and `.docx` supported (up to 10 MB)
- **Real-time AI simplification** — powered by Groq (Llama 3.1 8B Instant) — sub-second responses ⚡
- **Dark, accessible UI** — high contrast, WCAG-friendly design

---

## 🗂️ Project Structure

```
accessibility-assistant/
├── backend/              ← Python Flask API
│   ├── app.py            ← Main Flask app (Groq integration + endpoints)
│   ├── requirements.txt  ← Python dependencies
│   ├── Procfile          ← Render/Heroku process file
│   ├── build.sh          ← Render build script
│   └── .env.example      ← Environment variable template
└── frontend/             ← React + Vite + Tailwind CSS v4
    ├── src/
    │   ├── App.jsx        ← Main UI component
    │   ├── api.js         ← Axios API service layer
    │   ├── main.jsx       ← React root
    │   └── index.css      ← Tailwind v4 theme + component styles
    ├── index.html
    ├── vite.config.js
    └── vercel.json        ← Vercel SPA routing config
```

---

## 🚀 Run Locally

### Backend

```bash
cd backend
cp .env.example .env      # Edit .env → add GROQ_API_KEY
python -m venv .venv
source .venv/bin/activate  # Windows: .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py              # → http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
npm run dev                # → http://localhost:5173
```

---

## 🌐 Deployment

| Part      | Platform | Notes                                                      |
|-----------|----------|------------------------------------------------------------|
| Frontend  | Vercel   | Auto-detected Vite — connect the repo, set `VITE_API_URL` |
| Backend   | Render   | Build: `pip install -r requirements.txt` · Start: see Procfile |

### Environment Variables

| Variable       | Where   | Value                              |
|----------------|---------|------------------------------------|
| `GROQ_API_KEY` | Render  | Your Groq API key (get at console.groq.com) |
| `FRONTEND_URL` | Render  | Your Vercel frontend URL           |
| `VITE_API_URL` | Vercel  | Your Render backend URL            |

---

## 📡 API Endpoints

### `POST /simplify-text`
```json
// Request
{ "text": "complex text here", "level": "child" }

// Response
{ "simplified": "...", "level": "child", "original_length": 494, "simplified_length": 412 }
```

### `POST /upload-document`
- `multipart/form-data` with `file` (`.pdf`/`.docx`) and `level`

### `GET /health`
```json
{ "status": "ok", "ai_provider": "groq", "model": "llama-3.1-8b-instant", "groq_configured": true }
```

---

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite 8, Tailwind CSS v4, Axios, react-hot-toast, lucide-react
- **Backend:** Python 3, Flask 3, Flask-CORS, groq, PyPDF2, python-docx
- **AI:** Groq — Llama 3.1 8B Instant (`temperature=0.2`) ⚡ sub-second responses
- **Hosting:** Vercel (frontend) + Render (backend)
