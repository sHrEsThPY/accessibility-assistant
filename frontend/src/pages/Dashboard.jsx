import { useState, useRef, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  FileText, Upload, Sparkles, Copy, Check, Trash2,
  Loader2, AlertTriangle, Zap, BookOpen,
  ListChecks, Baby, Users, Server, LogOut,
  ChevronDown, BarChart3, History, Settings,
  ArrowUpRight, Clipboard, Download
} from 'lucide-react'
import { simplifyText, uploadDocument, pingHealth, parseApiError } from '../api'
import { useAuth } from '../context/AuthContext'

/* ─── Reading level config ────────────────────────────── */
const LEVELS = [
  {
    id: 'child',
    label: 'Child-Friendly',
    icon: Baby,
    desc: 'Simple words, ages 8–12',
    color: 'from-sky-500 to-cyan-500',
    bg: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
    activeBg: 'bg-sky-500 border-sky-400 text-white',
  },
  {
    id: 'adult',
    label: 'General Adult',
    icon: Users,
    desc: 'Plain English, no jargon',
    color: 'from-brand-500 to-violet-500',
    bg: 'bg-brand-500/10 border-brand-500/30 text-brand-400',
    activeBg: 'bg-brand-500 border-brand-400 text-white',
  },
  {
    id: 'bullet',
    label: 'Bullet Points',
    icon: ListChecks,
    desc: 'Concise key-point summary',
    color: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    activeBg: 'bg-emerald-500 border-emerald-400 text-white',
  },
]

const ACCEPTED_TYPES = '.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document'

function wordCount(str) {
  if (!str) return 0
  return str.trim().split(/\s+/).filter(Boolean).length
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function UserMenu({ user, onSignOut }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-surface-border bg-surface-raised hover:bg-surface-border transition-colors"
      >
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white">
          {user.avatar
            ? <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full" />
            : getInitials(user.name)
          }
        </div>
        <span className="text-sm text-slate-300 font-medium hidden sm:block max-w-[120px] truncate">{user.name}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-20 w-52 bg-surface-card border border-surface-border rounded-xl shadow-2xl shadow-black/40 overflow-hidden">
            <div className="px-4 py-3 border-b border-surface-border">
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
            <div className="p-1.5">
              <button className="dropdown-item">
                <Settings className="w-3.5 h-3.5" /> Account Settings
              </button>
              <button className="dropdown-item">
                <History className="w-3.5 h-3.5" /> History
              </button>
              <button className="dropdown-item">
                <BarChart3 className="w-3.5 h-3.5" /> Usage Stats
              </button>
              <div className="border-t border-surface-border my-1.5" />
              <button onClick={onSignOut} className="dropdown-item text-red-400 hover:bg-red-500/10 hover:text-red-300">
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Dashboard
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export default function Dashboard() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const [inputText, setInputText]       = useState('')
  const [outputText, setOutputText]     = useState('')
  const [level, setLevel]               = useState('adult')
  const [file, setFile]                 = useState(null)
  const [loading, setLoading]           = useState(false)
  const [copied, setCopied]             = useState(false)
  const [backendOk, setBackendOk]       = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [inputMode, setInputMode]       = useState('text')
  const [meta, setMeta]                 = useState(null)
  const [dragOver, setDragOver]         = useState(false)

  const fileInputRef = useRef(null)

  /* Health check */
  useEffect(() => {
    pingHealth()
      .then(data => {
        setBackendOk(true)
        if (!data.groq_configured && !data.gemini_configured) {
          toast.error('Backend running but API key is not configured.', { id: 'api-key' })
        }
      })
      .catch(() => {
        setBackendOk(false)
        toast.error('Cannot reach the backend. Make sure it is running on port 5000.', { id: 'health' })
      })
  }, [])

  const handleCopy = useCallback(async () => {
    if (!outputText) return
    try {
      await navigator.clipboard.writeText(outputText)
      setCopied(true)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Copy failed — select text manually.')
    }
  }, [outputText])

  function handleDownload() {
    if (!outputText) return
    const blob = new Blob([outputText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'simplified-text.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleClear = () => {
    setInputText('')
    setOutputText('')
    setFile(null)
    setMeta(null)
    setUploadProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFileChange = (selected) => {
    if (!selected) return
    const ext = selected.name.split('.').pop().toLowerCase()
    if (!['pdf', 'docx'].includes(ext)) {
      toast.error('Please upload a .pdf or .docx file.')
      return
    }
    if (selected.size > 10 * 1024 * 1024) {
      toast.error('File too large. Max size is 10 MB.')
      return
    }
    setFile(selected)
    setInputText('')
    toast.success(`${selected.name} ready to simplify`)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files?.[0]
    if (dropped) handleFileChange(dropped)
  }

  const handleSubmit = async () => {
    if (loading) return
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
      toast.success('Text simplified!')
    } catch (err) {
      toast.error(parseApiError(err))
    } finally {
      setLoading(false)
    }
  }

  function handleSignOut() {
    signOut()
    navigate('/')
  }

  const activeLevel = LEVELS.find(l => l.id === level)

  return (
    <div className="min-h-screen bg-surface flex flex-col">

      {/* ═══ Header ═══ */}
      <header className="sticky top-0 z-30 w-full border-b border-surface-border bg-surface/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-5 py-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-600/20 group-hover:shadow-brand-500/30 transition-shadow">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none">AccessAI</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Accessibility Assistant</p>
            </div>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Backend status */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-surface-border bg-surface-raised">
              {backendOk === null && <><Loader2 className="w-3 h-3 animate-spin text-slate-500" /><span className="text-slate-500">Connecting</span></>}
              {backendOk === true && <><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /><span className="text-emerald-400">Backend Online</span></>}
              {backendOk === false && <><div className="w-1.5 h-1.5 rounded-full bg-red-400" /><span className="text-red-400">Offline</span></>}
            </div>

            {user && <UserMenu user={user} onSignOut={handleSignOut} />}
          </div>
        </div>
      </header>

      {/* ═══ Main ═══ */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-5">

        {/* Welcome banner */}
        {user && (
          <div className="flex items-center justify-between animate-fade-in">
            <div>
              <h1 className="text-lg font-bold text-white">
                Welcome back, {user.name.split(' ')[0]} 👋
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">Simplify any complex document in seconds</p>
            </div>
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              Powered by Google Gemini
            </div>
          </div>
        )}

        {/* ─── Level + Mode Controls ─── */}
        <section className="glass-card p-5 animate-fade-in">
          <div className="flex flex-col lg:flex-row lg:items-center gap-5">
            {/* Reading Level */}
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Reading Level
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {LEVELS.map(lv => {
                  const Icon = lv.icon
                  const isActive = level === lv.id
                  return (
                    <button
                      key={lv.id}
                      onClick={() => setLevel(lv.id)}
                      aria-pressed={isActive}
                      className={`level-card ${isActive ? 'level-card-active' : 'level-card-inactive'}`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 transition-all ${
                        isActive
                          ? `bg-gradient-to-br ${lv.color} shadow-lg`
                          : 'bg-surface-raised'
                      }`}>
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      </div>
                      <span className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-slate-400'}`}>{lv.label}</span>
                      <span className={`text-[10px] mt-0.5 ${isActive ? 'text-white/70' : 'text-slate-600'}`}>{lv.desc}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Input mode */}
            <div className="lg:w-auto">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Input Method
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => { setInputMode('text'); setFile(null) }}
                  className={`mode-btn ${inputMode === 'text' ? 'mode-btn-active' : 'mode-btn-inactive'}`}
                >
                  <Clipboard className="w-4 h-4" />
                  <span>Paste Text</span>
                </button>
                <button
                  onClick={() => setInputMode('file')}
                  className={`mode-btn ${inputMode === 'file' ? 'mode-btn-active' : 'mode-btn-inactive'}`}
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload File</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Dual Pane ─── */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 flex-1">

          {/* LEFT: Input */}
          <div className="glass-card p-5 flex flex-col animate-slide-up" style={{ animationDelay: '0.05s' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-400" />
                Original Input
              </h2>
              {inputText && (
                <span className="text-xs bg-surface-raised border border-surface-border px-2 py-0.5 rounded-full text-slate-400">
                  {wordCount(inputText).toLocaleString()} words
                </span>
              )}
            </div>

            {inputMode === 'text' ? (
              <textarea
                id="input-textarea"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="Paste your complex legal, medical, or technical text here…"
                className="input-area flex-1 min-h-[280px]"
                aria-label="Text to simplify"
              />
            ) : (
              <div
                onDrop={handleDrop}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                className={`flex-1 flex flex-col items-center justify-center gap-4 border-2 border-dashed rounded-xl p-8 transition-all min-h-[280px] cursor-pointer ${
                  dragOver
                    ? 'border-brand-500 bg-brand-600/5'
                    : file
                      ? 'border-emerald-600/40 bg-emerald-900/5'
                      : 'border-surface-border hover:border-brand-700 hover:bg-brand-900/5'
                }`}
                onClick={() => !file && fileInputRef.current?.click()}
              >
                {file ? (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <FileText className="w-8 h-8 text-emerald-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-white font-medium">{file.name}</p>
                      <p className="text-xs text-slate-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); setFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                      className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors px-3 py-1 rounded-lg border border-red-500/20 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-3 h-3" /> Remove File
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-surface-raised border border-surface-border flex items-center justify-center">
                      <Upload className="w-7 h-7 text-slate-500" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-slate-300">
                        {dragOver ? 'Drop it here!' : 'Drag & drop or click to browse'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Supports <span className="text-brand-400">.pdf</span> and{' '}
                        <span className="text-brand-400">.docx</span> up to 10 MB
                      </p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }}
                      className="btn-ghost text-sm"
                    >
                      Browse Files
                    </button>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_TYPES}
                  onChange={e => handleFileChange(e.target.files?.[0])}
                  className="hidden"
                />
              </div>
            )}

            {/* Upload progress */}
            {loading && uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Uploading…</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-1.5 bg-surface-raised rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 to-violet-500 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="mt-4 flex gap-2.5">
              <button
                id="btn-simplify"
                onClick={handleSubmit}
                disabled={loading || (inputMode === 'text' ? !inputText.trim() : !file)}
                className="btn-primary flex-1 justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {uploadProgress > 0 && uploadProgress < 100
                      ? `Uploading ${uploadProgress}%…`
                      : 'Simplifying…'}
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Simplify Now
                  </>
                )}
              </button>
              <button
                onClick={handleClear}
                className="btn-ghost"
                title="Clear all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* RIGHT: Output */}
          <div className="glass-card p-5 flex flex-col animate-slide-up" style={{ animationDelay: '0.12s' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                Simplified Output
                {meta && (
                  <span className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full capitalize">
                    {meta.level}
                  </span>
                )}
              </h2>
              {outputText && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleDownload}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-surface-raised transition-all"
                    title="Download as .txt"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    id="btn-copy"
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-surface-raised border border-surface-border text-slate-400 hover:text-white hover:border-brand-500/50 transition-all"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 min-h-[280px] overflow-auto">
              {loading ? (
                <div className="space-y-3 animate-pulse pt-1" role="status" aria-label="Loading">
                  {[75, 100, 85, 60, 90, 70, 50, 80, 65].map((w, i) => (
                    <div key={i} className="h-3.5 bg-surface-raised rounded-full" style={{ width: `${w}%` }} />
                  ))}
                </div>
              ) : outputText ? (
                <div
                  className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap animate-fade-in"
                  id="output-text"
                >
                  {outputText}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-surface-raised border border-surface-border flex items-center justify-center opacity-50">
                    <BookOpen className="w-7 h-7 text-slate-600" />
                  </div>
                  <div className="opacity-50">
                    <p className="text-sm text-slate-400 font-medium">Your simplified text appears here</p>
                    <p className="text-xs text-slate-600 mt-1">Choose a level and click Simplify Now</p>
                  </div>
                </div>
              )}
            </div>

            {/* Meta footer */}
            {meta && !loading && (
              <div className="mt-4 pt-3 border-t border-surface-border animate-fade-in">
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
                  <span className="text-slate-500">
                    Original: <span className="text-slate-300">{meta.originalLength?.toLocaleString()} chars</span>
                  </span>
                  <span className="text-slate-500">
                    Result: <span className="text-slate-300">{meta.simplifiedLength?.toLocaleString()} chars</span>
                  </span>
                  {meta.filename && (
                    <span className="text-slate-500">
                      File: <span className="text-slate-300">{meta.filename}</span>
                    </span>
                  )}
                  {meta.pageCount && (
                    <span className="text-slate-500">
                      Pages: <span className="text-slate-300">{meta.pageCount}</span>
                    </span>
                  )}
                  {meta.truncated && (
                    <span className="text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Document was truncated
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* ═══ Footer ═══ */}
      <footer className="border-t border-surface-border py-4 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
          <p>AccessAI · Built with React, Flask &amp; Google Gemini</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-slate-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Help</a>
            <Link to="/" className="hover:text-slate-400 transition-colors flex items-center gap-1">
              Back to Home <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

