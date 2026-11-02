import axios from 'axios'

/**
 * Base URL:
 * - In development Vite proxies /api → http://localhost:5000
 * - In production set VITE_API_URL to your Render backend URL
 */
const BASE_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL
  : '/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60_000, // 60 s — Gemini can be slow on first cold start
})

/**
 * Simplify raw text via POST /simplify-text
 * @param {string} text      - Raw text to simplify
 * @param {string} level     - 'child' | 'adult' | 'bullet'
 * @returns {Promise<{simplified:string, level:string, original_length:number, simplified_length:number}>}
 */
export async function simplifyText(text, level) {
  const response = await api.post('/simplify-text', { text, level })
  return response.data
}

/**
 * Upload a document (PDF or DOCX) and get simplified text back.
 * @param {File}   file   - The file object from an <input type="file">
 * @param {string} level  - 'child' | 'adult' | 'bullet'
 * @param {function} onProgress - optional upload progress callback (0-100)
 * @returns {Promise<{simplified:string, filename:string, page_count?:number, ...}>}
 */
export async function uploadDocument(file, level, onProgress) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('level', level)

  const response = await api.post('/upload-document', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) {
        const pct = Math.round((evt.loaded / evt.total) * 100)
        onProgress(pct)
      }
    },
  })
  return response.data
}

/**
 * Ping the backend health endpoint.
 * Used on mount to warn users if the backend is unreachable.
 */
export async function pingHealth() {
  const response = await api.get('/health')
  return response.data
}

/**
 * Normalise Axios errors into user-friendly strings.
 * @param {unknown} err
 * @returns {string}
 */
export function parseApiError(err) {
  if (axios.isAxiosError(err)) {
    // Server responded with an error body
    if (err.response) {
      const serverMsg = err.response.data?.error
      if (serverMsg) return serverMsg

      switch (err.response.status) {
        case 400: return 'Bad request — check your input and try again.'
        case 413: return 'File is too large. Please upload a file under 10 MB.'
        case 415: return 'Unsupported file type. Please use a .pdf or .docx file.'
        case 422: return 'Validation failed — please check your text or file.'
        case 429: return 'Rate limit hit. Please wait a moment and try again.'
        case 503: return 'The AI service is temporarily unavailable. Please try again shortly.'
        default:  return `Server error (${err.response.status}). Please try again.`
      }
    }

    // Request sent but no response received (network down, timeout)
    if (err.request) {
      if (err.code === 'ECONNABORTED') {
        return 'Request timed out — the AI is taking too long. Please try again.'
      }
      return 'Network error — please check your internet connection and try again.'
    }
  }

  // Fallback for unexpected errors
  return 'An unexpected error occurred. Please refresh and try again.'
}
