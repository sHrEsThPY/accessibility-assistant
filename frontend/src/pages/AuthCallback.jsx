import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { completeOAuth } = useAuth()
  const [message, setMessage] = useState('Finishing sign-in…')

  useEffect(() => {
    const error = params.get('error')
    const token = params.get('token')

    if (error) {
      const pretty = decodeURIComponent(error).replaceAll('_', ' ')
      toast.error(`GitHub sign-in failed: ${pretty}`)
      navigate('/login', { replace: true })
      return
    }

    if (!token) {
      toast.error('Missing sign-in token. Please try again.')
      navigate('/login', { replace: true })
      return
    }

    completeOAuth(token)
      .then(() => {
        toast.success('Signed in with GitHub!')
        navigate('/dashboard', { replace: true })
      })
      .catch(() => {
        setMessage('Could not complete sign-in.')
        toast.error('GitHub sign-in could not be completed. Please try again.')
        navigate('/login', { replace: true })
      })
  }, [completeOAuth, navigate, params])

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center text-slate-300">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
          {message}
        </div>
      </div>
    </div>
  )
}
