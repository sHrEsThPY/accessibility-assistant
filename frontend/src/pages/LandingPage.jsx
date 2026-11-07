import { Link } from 'react-router-dom'
import {
  Sparkles, ArrowRight, FileText, Zap, Shield, Globe,
  ChevronRight, Star, Users, BookOpen, CheckCircle,
  Baby, ListChecks, Upload, Brain, Lock, Rocket
} from 'lucide-react'

const FEATURES = [
  {
    icon: Brain,
    title: 'AI-Powered Simplification',
    desc: 'Google Gemini 1.5 Flash instantly transforms complex jargon into clear, understandable language.',
    color: 'from-indigo-500 to-purple-600',
    glow: 'shadow-indigo-500/20',
  },
  {
    icon: FileText,
    title: 'Document Support',
    desc: 'Upload PDFs or DOCX files up to 10 MB. Paste text directly — whatever works best for you.',
    color: 'from-sky-500 to-cyan-600',
    glow: 'shadow-sky-500/20',
  },
  {
    icon: Users,
    title: 'Multiple Reading Levels',
    desc: 'Choose Child-Friendly (8–12 yrs), General Adult plain English, or Bullet Point summaries.',
    color: 'from-emerald-500 to-teal-600',
    glow: 'shadow-emerald-500/20',
  },
  {
    icon: Shield,
    title: 'Privacy First',
    desc: 'Your documents are processed in memory and never stored. We take your privacy seriously.',
    color: 'from-rose-500 to-pink-600',
    glow: 'shadow-rose-500/20',
  },
  {
    icon: Zap,
    title: 'Real-Time Results',
    desc: 'Get simplified text in seconds, not minutes. Fast enough for real-world workflows.',
    color: 'from-amber-500 to-orange-600',
    glow: 'shadow-amber-500/20',
  },
  {
    icon: Globe,
    title: 'Accessible by Design',
    desc: 'High-contrast, WCAG-friendly UI. Built so everyone — regardless of ability — can use it.',
    color: 'from-violet-500 to-fuchsia-600',
    glow: 'shadow-violet-500/20',
  },
]

const STEPS = [
  { icon: Upload, step: '01', title: 'Upload or Paste', desc: 'Drop a PDF/DOCX or paste your complex text directly.' },
  { icon: ListChecks, step: '02', title: 'Choose Level', desc: 'Select Child-Friendly, General Adult, or Bullet Points.' },
  { icon: Sparkles, step: '03', title: 'AI Simplifies', desc: 'Gemini processes and rewrites the content in seconds.' },
  { icon: BookOpen, step: '04', title: 'Read & Share', desc: 'Copy the simplified text, download it, or share it.' },
]

const TESTIMONIALS = [
  {
    name: 'Dr. Sarah Chen',
    role: 'Medical Researcher',
    text: 'I use this every day to translate patient consent forms into language families can actually understand. It\'s been transformative.',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Sarah&backgroundColor=b6e3f4',
    stars: 5,
  },
  {
    name: 'Marcus Thompson',
    role: 'Legal Aid Coordinator',
    text: 'Our clients finally understand their rights. This tool has bridged the gap between legal language and real people.',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Marcus&backgroundColor=d1d4f9',
    stars: 5,
  },
  {
    name: 'Priya Patel',
    role: 'High School Teacher',
    text: 'I simplify technical articles for my students with one click. The bullet-point mode is perfect for class discussions.',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Priya&backgroundColor=c0aede',
    stars: 5,
  },
]

const STATS = [
  { value: '50K+', label: 'Documents Simplified' },
  { value: '99%', label: 'Accuracy Rate' },
  { value: '<3s', label: 'Average Response Time' },
  { value: '4.9★', label: 'User Rating' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface text-slate-200 overflow-x-hidden">

      {/* ══════════ Nav ══════════ */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-surface-border/50 bg-surface/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-600/30">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-base font-bold text-white tracking-tight">AccessAI</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Testimonials</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-slate-400 hover:text-white transition-colors px-3 py-1.5">
              Sign In
            </Link>
            <Link to="/signup" className="btn-primary-sm">
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ══════════ Hero ══════════ */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-brand-600/10 blur-[120px]" />
          <div className="absolute -bottom-20 -left-40 w-[500px] h-[500px] rounded-full bg-violet-600/8 blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-indigo-900/5 blur-[160px]" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-brand-950/80 border border-brand-800/60 rounded-full px-4 py-1.5 text-xs text-brand-300 font-medium mb-6 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            Powered by Google Gemini 1.5 Flash
            <span className="bg-brand-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">NEW</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-[1.08] tracking-tight mb-6">
            Complex Docs,{' '}
            <span className="bg-gradient-to-r from-brand-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
              Made Simple
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
            Turn legal contracts, medical reports, and technical manuals into plain language anyone can understand.
            Just upload, choose a reading level, and let AI do the work.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup" className="btn-hero-primary group">
              Start Simplifying — It&apos;s Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/login" className="btn-hero-ghost">
              Sign In to Your Account
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
            {['No credit card required', 'Free tier available', 'Privacy-first design'].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Hero App Preview */}
        <div className="relative max-w-4xl mx-auto mt-16">
          <div className="relative rounded-2xl overflow-hidden border border-surface-border shadow-2xl shadow-black/40">
            {/* Fake browser chrome */}
            <div className="bg-surface-card border-b border-surface-border px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
              </div>
              <div className="flex-1 mx-4 bg-surface-raised rounded-md px-3 py-1 text-xs text-slate-500 text-center">
                accessai.app/dashboard
              </div>
            </div>
            {/* App UI mock */}
            <div className="bg-surface p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-card border border-surface-border rounded-xl p-4">
                  <div className="text-xs text-slate-500 mb-3 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-brand-400" />
                    Original Input
                  </div>
                  <div className="space-y-2">
                    {[75, 90, 60, 85, 50].map((w, i) => (
                      <div key={i} className="h-2.5 bg-surface-raised rounded-full" style={{ width: `${w}%` }} />
                    ))}
                  </div>
                </div>
                <div className="bg-surface-card border border-brand-800/40 rounded-xl p-4">
                  <div className="text-xs text-emerald-400 mb-3 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    Simplified Output
                  </div>
                  <div className="space-y-2">
                    {[85, 70, 90, 55, 80].map((w, i) => (
                      <div key={i} className="h-2.5 bg-brand-900/40 rounded-full relative overflow-hidden">
                        <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-600/60 to-brand-500/40 rounded-full animate-shimmer" style={{ width: `${w}%` }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex gap-2">
                  {['Child-Friendly', 'General Adult', 'Bullet Points'].map((l, i) => (
                    <span key={l} className={`text-xs px-2.5 py-1 rounded-full border ${i === 1 ? 'bg-brand-600 border-brand-500 text-white' : 'bg-surface-raised border-surface-border text-slate-500'}`}>
                      {l}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  AI Processing…
                </div>
              </div>
            </div>
          </div>
          {/* Glow under preview */}
          <div className="absolute -bottom-10 inset-x-10 h-20 bg-brand-600/20 blur-2xl rounded-full pointer-events-none" />
        </div>
      </section>

      {/* ══════════ Stats ══════════ */}
      <section className="py-14 px-6 border-y border-surface-border/50">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map(s => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-extrabold text-white mb-1">{s.value}</div>
              <div className="text-sm text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════ Features ══════════ */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest">Features</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2 mb-4">Everything You Need</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Built for accessibility professionals, educators, legal workers, and anyone who needs clarity from complexity.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(f => {
              const Icon = f.icon
              return (
                <div key={f.title} className="feature-card group">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg ${f.glow} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══════════ How It Works ══════════ */}
      <section id="how-it-works" className="py-24 px-6 bg-surface-card/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest">How It Works</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2 mb-4">Four Simple Steps</h2>
            <p className="text-slate-400 max-w-xl mx-auto">From complex to clear in under 10 seconds. No technical knowledge required.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s, i) => {
              const Icon = s.icon
              return (
                <div key={s.step} className="relative text-center group">
                  {i < STEPS.length - 1 && (
                    <div className="hidden lg:block absolute top-8 left-[calc(50%+2rem)] right-[-calc(50%-2rem)] h-px bg-gradient-to-r from-surface-border to-transparent" />
                  )}
                  <div className="w-16 h-16 rounded-2xl bg-surface-card border border-surface-border flex items-center justify-center mx-auto mb-4 group-hover:border-brand-600/50 transition-colors">
                    <Icon className="w-7 h-7 text-brand-400" />
                  </div>
                  <div className="text-xs font-bold text-brand-500 mb-1">{s.step}</div>
                  <h3 className="text-sm font-semibold text-white mb-1.5">{s.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══════════ Testimonials ══════════ */}
      <section id="testimonials" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest">Testimonials</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2 mb-4">Loved by Professionals</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Real people making real impact with AccessAI every day.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="testimonial-card">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(t.stars)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-300 leading-relaxed mb-5 italic">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full bg-surface-raised" />
                  <div>
                    <div className="text-sm font-semibold text-white">{t.name}</div>
                    <div className="text-xs text-slate-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ CTA ══════════ */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative bg-gradient-to-br from-brand-900/60 to-violet-900/40 border border-brand-800/40 rounded-3xl p-12 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-600/5 to-violet-600/5" />
            <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-brand-500/10 blur-3xl" />
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-brand-600/30">
                <Rocket className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to Make Documents Accessible?
              </h2>
              <p className="text-slate-400 mb-8 max-w-lg mx-auto">
                Join thousands of educators, legal professionals, and healthcare workers who use AccessAI to break down complexity.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/signup" className="btn-hero-primary group">
                  Create Free Account
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/login" className="btn-hero-ghost">
                  <Lock className="w-4 h-4" /> Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ Footer ══════════ */}
      <footer className="border-t border-surface-border py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">AccessAI</span>
          </div>
          <p className="text-xs text-slate-600">© 2026 AccessAI · Built with React, Flask &amp; Google Gemini</p>
          <div className="flex gap-5 text-xs text-slate-500">
            <a href="#" className="hover:text-slate-300 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Terms</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

