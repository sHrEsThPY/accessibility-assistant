import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

/**
 * Simulated Auth – in production, replace with real OAuth / JWT calls.
 * State is persisted to sessionStorage so it survives hot-reloads.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = sessionStorage.getItem('aa_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) sessionStorage.setItem('aa_user', JSON.stringify(user))
    else sessionStorage.removeItem('aa_user')
  }, [user])

  /** Email + password sign-in (simulated) */
  async function signIn(email, password) {
    setLoading(true)
    await new Promise(r => setTimeout(r, 900))
    setLoading(false)
    if (!email || !password) throw new Error('Please fill in all fields.')
    // Simulate success
    setUser({ name: email.split('@')[0], email, provider: 'email', avatar: null })
  }

  /** Social sign-in (Google / GitHub) – simulated */
  async function signInWithProvider(provider) {
    setLoading(true)
    await new Promise(r => setTimeout(r, 1200))
    setLoading(false)
    const mockData = {
      google: { name: 'Alex Johnson', email: 'alex@gmail.com', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Alex' },
      github: { name: 'DevUser', email: 'dev@github.com', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Dev' },
    }
    setUser({ ...mockData[provider], provider })
  }

  /** Email + password sign-up (simulated) */
  async function signUp(name, email, password) {
    setLoading(true)
    await new Promise(r => setTimeout(r, 1000))
    setLoading(false)
    if (!name || !email || !password) throw new Error('Please fill in all fields.')
    if (password.length < 6) throw new Error('Password must be at least 6 characters.')
    setUser({ name, email, provider: 'email', avatar: null })
  }

  function signOut() {
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signInWithProvider, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

