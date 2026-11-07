import { useState, useRef, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import {
  FileText, Upload, Sparkles, Copy, Check, Trash2,
  Loader2, AlertTriangle, ChevronDown, Zap, BookOpen,
  ListChecks, Baby, Users, Server
} from 'lucide-react'
import { simplifyText, uploadDocument, pingHealth, parseApiError } from './api'

/* ─── Reading level config ────────────────────────────── */
const LEVELS = [
  { id: 'child',  label: 'Child-Friendly', icon: Baby,       desc: 'Simple words for ages 8–12' },
  { id: 'adult',  label: 'General Adult',  icon: Users,      desc: 'Plain English, no jargon' },
  { id: 'bullet', label: 'Bullet Points',  icon: ListChecks, desc: 'Concise key-point summary' },
]

/* ─── Helpers ─────────────────────────────────────────── */
const ACCEPTED_TYPES = '.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document'

function wordCount(str) {
  if (!str) return 0
  return str.trim().split(/\s+/).filter(Boolean).length
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   App
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export default function App() {
  /* ── State ───────────────────────────────────────────── */
  const [inputText, setInputText]       = useState('')
  const [outputText, setOutputText]     = useState('')
  const [level, setLevel]               = useState('adult')
  const [file, setFile]                 = useState(null)
  const [loading, setLoading]           = useState(false)
  const [copied, setCopied]             = useState(false)
  const [backendOk, setBackendOk]       = useState(null) // null = checking, true/false
  const [uploadProgress, setUploadProgress] = useState(0)
  const [inputMode, setInputMode]       = useState('text') // 'text' | 'file'
  const [meta, setMeta]                 = useState(null)   // response metadata

  const fileInputRef = useRef(null)

  /* ── Health check on mount ───────────────────────────── */
  useEffect(() => {
    pingHealth()
      .then((data) => {
        setBackendOk(true)
        if (!data.groq_configured) {
          toast.error('Backend is running but GROQ_API_KEY is not configured.', { id: 'api-key' })
        }
      })
      .catch(() => {
        setBackendOk(false)
        toast.error('Cannot reach the backend server. Make sure it is running on port 5000.', { id: 'health' })
      })
  }, [])

  /* ── Copy to clipboard ───────────────────────────────── */
  const handleCopy = useCallback(async () => {
    if (!outputText) return
    try {
      await navigator.clipboard.writeText(outputText)
      setCopied(true)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy — try selecting the text manually.')
    }
  }, [outputText])

  /* ── Clear everything ────────────────────────────────── */
  const handleClear = () => {
    setInputText('')
    setOutputText('')
    setFile(null)
    setMeta(null)
    setUploadProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  /* ── File selection ──────────────────────────────────── */
  const handleFileChange = (e) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    const ext = selected.name.split('.').pop().toLowerCase()
    if (!['pdf', 'docx'].includes(ext)) {
      toast.error('Please upload a .pdf or .docx file.')
      e.target.value = ''
      return
    }

    if (selected.size > 10 * 1024 * 1024) {
      toast.error('File is too large. Maximum allowed size is 10 MB.')
      e.target.value = ''
      return
    }

    setFile(selected)
    setInputText('')
    toast.success(`${selected.name} ready to simplify`)
  }

  /* ── Submit handler ──────────────────────────────────── */
  const handleSubmit = async () => {
    if (loading) return

    // Validate
    if (inputMode === 'text' && !inputText.trim()) {
      toast.error('Please enter some text to simplify.')
      return
    }
    if (inputMode === 'file' && !file) {
      toast.error('Please upload a document first.')
      return
    }

    setLoading(true)
    setOutputText('')
    setMeta(null)
    setUploadProgress(0)

    try {
      let result
      if (inputMode === 'file' && file) {
        result = await uploadDocument(file, level, setUploadProgress)
      } else {
        result = await simplifyText(inputText, level)
      }

      setOutputText(result.simplified)
      setMeta({
        level: result.level,
        originalLength: result.original_length,
        simplifiedLength: result.simplified_length,
        filename: result.filename,
        pageCount: result.page_count,
        truncated: result.truncated,
      })
      toast.success('Text simplified successfully!')
    } catch (err) {
      const msg = parseApiError(err)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     Render
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  return (
    <div className="min-h-screen bg-surface flex flex-col">

      {/* ═══════ Header ═══════ */}
      <header className="w-full border-b border-surface-border bg-surface-card/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-600/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight leading-none">
                Accessibility Assistant
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">Powered by Google Gemini</p>
            </div>
          </div>

          {/* Status badge */}
          <div className="flex items-center gap-2 text-xs">
            {backendOk === null && (
              <span className="flex items-center gap-1.5 text-slate-500">
                <Loader2 className="w-3 h-3 animate-spin" /> Connecting…
              </span>
            )}
            {backendOk === true && (
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Server className="w-3 h-3" /> Backend Online
              </span>
            )}
            {backendOk === false && (
              <span className="flex items-center gap-1.5 text-red-400">
                <AlertTriangle className="w-3 h-3" /> Backend Offline
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ═══════ Main Content ═══════ */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">

        {/* ─── Controls Bar ───────────────────────────── */}
        <section className="glass-card p-5 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-end gap-5">

            {/* Reading Level */}
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Reading Level
              </label>
              <div className="flex gap-2 flex-wrap">
                {LEVELS.map((lv) => {
                  const Icon = lv.icon
                  const isActive = level === lv.id
                  return (
                    <button
                      key={lv.id}
                      id={`level-${lv.id}`}
                      onClick={() => setLevel(lv.id)}
                      className={`level-pill flex items-center gap-2 ${isActive ? 'level-pill-active animate-pulse-glow' : 'level-pill-inactive'}`}
                      aria-pressed={isActive}
                      title={lv.desc}
                    >
                      <Icon className="w-4 h-4" />
                      {lv.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Input mode toggle */}
            <div className="flex gap-2">
              <button
                id="mode-text"
                onClick={() => { setInputMode('text'); setFile(null); }}
                className={`btn-ghost text-sm ${inputMode === 'text' ? '!border-brand-500 !text-white' : ''}`}
              >
                <FileText className="w-4 h-4" /> Paste Text
              </button>
              <button
                id="mode-file"
                onClick={() => setInputMode('file')}
                className={`btn-ghost text-sm ${inputMode === 'file' ? '!border-brand-500 !text-white' : ''}`}
              >
                <Upload className="w-4 h-4" /> Upload File
              </button>
            </div>
          </div>
        </section>

        {/* ─── Dual Pane ──────────────────────────────── */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 flex-1 min-h-0">

          {/* LEFT: Input */}
          <div className="glass-card p-5 flex flex-col animate-slide-up" style={{ animationDelay: '0.05s' }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-400" />
                Original Input
              </h2>
              {inputText && (
                <span className="text-xs text-slate-500">{wordCount(inputText)} words</span>
              )}
            </div>

            {inputMode === 'text' ? (
              <textarea
                id="input-textarea"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste your complex legal, medical, or technical text here…"
                className="input-area flex-1 min-h-[280px]"
                aria-label="Text to simplify"
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 border-2 border-dashed border-surface-border rounded-xl p-8 hover:border-brand-600 transition-colors min-h-[280px]">
                {file ? (
                  <>
                    <div className="w-14 h-14 rounded-full bg-brand-600/20 flex items-center justify-center">
                      <FileText className="w-7 h-7 text-brand-400" />
                    </div>
                    <p className="text-sm text-slate-300 text-center font-medium">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                    <button
                      onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                      className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-full bg-surface-raised flex items-center justify-center">
                      <Upload className="w-7 h-7 text-slate-500" />
                    </div>
                    <p className="text-sm text-slate-400 text-center">
                      Drop a <span className="text-brand-400 font-medium">.pdf</span> or{' '}
                      <span className="text-brand-400 font-medium">.docx</span> file here
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="btn-ghost text-sm"
                    >
                      Browse Files
                    </button>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  id="file-upload"
                  type="file"
                  accept={ACCEPTED_TYPES}
                  onChange={handleFileChange}
                  className="hidden"
                  aria-label="Upload PDF or DOCX document"
                />
              </div>
            )}

            {/* Action buttons */}
            <div className="mt-4 flex gap-3">
              <button
                id="btn-simplify"
                onClick={handleSubmit}
                disabled={loading || (inputMode === 'text' ? !inputText.trim() : !file)}
                className="btn-primary flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin-slow" />
                    {uploadProgress > 0 && uploadProgress < 100
                      ? `Uploading ${uploadProgress}%…`
                      : 'Simplifying…'}
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" /> Simplify Now
                  </>
                )}
              </button>
              <button
                id="btn-clear"
                onClick={handleClear}
                className="btn-ghost"
                title="Clear all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* RIGHT: Output */}
          <div className="glass-card p-5 flex flex-col animate-slide-up" style={{ animationDelay: '0.15s' }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                Simplified Output
              </h2>
              {outputText && (
                <button
                  id="btn-copy"
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              )}
            </div>

            {/* Output area */}
            <div className="flex-1 min-h-[280px] overflow-auto">
              {loading ? (
                /* ── Skeleton loader ── */
                <div className="space-y-3 animate-pulse" role="status" aria-label="Loading">
                  <div className="h-4 bg-surface-raised rounded w-3/4" />
                  <div className="h-4 bg-surface-raised rounded w-full" />
                  <div className="h-4 bg-surface-raised rounded w-5/6" />
                  <div className="h-4 bg-surface-raised rounded w-2/3" />
                  <div className="h-4 bg-surface-raised rounded w-full" />
                  <div className="h-4 bg-surface-raised rounded w-4/5" />
                  <div className="h-4 bg-surface-raised rounded w-1/2 mt-5" />
                  <div className="h-4 bg-surface-raised rounded w-full" />
                  <div className="h-4 bg-surface-raised rounded w-3/4" />
                </div>
              ) : outputText ? (
                <div
                  className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap animate-fade-in"
                  id="output-text"
                >
                  {outputText}
                </div>
              ) : (
                /* ── Empty state ── */
                <div className="flex flex-col items-center justify-center h-full text-center gap-3 opacity-50">
                  <BookOpen className="w-10 h-10 text-slate-600" />
                  <p className="text-sm text-slate-500">
                    Your simplified text will appear here
                  </p>
                </div>
              )}
            </div>

            {/* Meta footer */}
            {meta && !loading && (
              <div className="mt-4 pt-3 border-t border-surface-border flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 animate-fade-in">
                <span>Level: <span className="text-slate-400 capitalize">{meta.level}</span></span>
                <span>Original: <span className="text-slate-400">{meta.originalLength?.toLocaleString()} chars</span></span>
                <span>Simplified: <span className="text-slate-400">{meta.simplifiedLength?.toLocaleString()} chars</span></span>
                {meta.filename && <span>File: <span className="text-slate-400">{meta.filename}</span></span>}
                {meta.pageCount && <span>Pages: <span className="text-slate-400">{meta.pageCount}</span></span>}
                {meta.truncated && (
                  <span className="text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Document was truncated
                  </span>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* ═══════ Footer ═══════ */}
      <footer className="border-t border-surface-border py-4 text-center text-xs text-slate-600">
        <p>Accessibility Assistant · Built with React, Flask & Google Gemini</p>
      </footer>
    </div>
  )
}
