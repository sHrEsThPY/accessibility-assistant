# Accessibility Assistant for Simple-Language Explanations

> **AI-powered tool that turns complex legal, medical, and technical documents into plain, easy-to-understand language — in seconds.**

![Tech Stack](https://img.shields.io/badge/React-Vite-blue?logo=react) ![Flask](https://img.shields.io/badge/Flask-Python-green?logo=python) ![Gemini](https://img.shields.io/badge/Google-Gemini%201.5%20Flash-orange?logo=google)

---

## ✨ Features

- **Three reading levels** — Child-Friendly (age 8–12), General Adult (plain English), Bullet Points
- **Paste text directly** — from any source
- **Upload documents** — `.pdf` and `.docx` supported (up to 10 MB)
- **Real-time AI simplification** — powered by Google Gemini 1.5 Flash at temperature 0.2
- **Dark, accessible UI** — high contrast, WCAG-friendly design

---

## 🗂️ Project Structure

```
accessibility-assistant/
├── backend/              ← Python Flask API
│   ├── app.py            ← Main Flask app (endpoints + Gemini integration)
│   ├── requirements.txt  ← Python dependencies
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
cp .env.example .env      # Edit .env → add GEMINI_API_KEY
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

| Part      | Platform | Command                                                    |
|-----------|----------|------------------------------------------------------------|
| Frontend  | Vercel   | Auto-detected Vite — just connect the repo                 |
| Backend   | Render   | Build: `./build.sh` · Start: `gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120` |

### Environment Variables

| Variable        | Where         | Value                              |
|-----------------|---------------|------------------------------------|
| `GEMINI_API_KEY`| Render        | Your Google Gemini API key         |
| `FRONTEND_URL`  | Render        | Your Vercel frontend URL           |
| `VITE_API_URL`  | Vercel        | Your Render backend URL            |

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
{ "status": "ok", "gemini_configured": true }
```

---

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite 8, Tailwind CSS v4, Axios, react-hot-toast, lucide-react
- **Backend:** Python 3, Flask 3, Flask-CORS, google-generativeai, PyPDF2, python-docx
- **AI:** Google Gemini 1.5 Flash (`temperature=0.2`)
- **Hosting:** Vercel (frontend) + Render (backend)
