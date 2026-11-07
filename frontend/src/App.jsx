import { Routes, Route, Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from './context/AuthContext'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import Dashboard from './pages/Dashboard'
import AuthCallback from './pages/AuthCallback'

function PublicRoute({ children }) {
  const { user, ready } = useAuth()
  if (!ready) return <BootScreen />
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

function PrivateRoute({ children }) {
  const { user, ready } = useAuth()
  if (!ready) return <BootScreen />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function BootScreen() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center text-slate-400">
      <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicRoute>
            <SignupPage />
          </PublicRoute>
        }
      />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
