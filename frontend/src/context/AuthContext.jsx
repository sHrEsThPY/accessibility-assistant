import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  fetchAuthConfig,
  loginWithEmail,
  signupWithEmail,
  loginWithGoogle,
  fetchCurrentUser,
  getApiRoot,
} from '../api'

const AuthContext = createContext(null)

const TOKEN_KEY = 'aa_token'
const USER_KEY = 'aa_user'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem(USER_KEY)
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) || null)
  const [config, setConfig] = useState({ google: false, github: false, google_client_id: '' })
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)

  const persistAuth = useCallback((jwt, profile) => {
    setToken(jwt)
    setUser(profile)
    if (jwt) sessionStorage.setItem(TOKEN_KEY, jwt)
    else sessionStorage.removeItem(TOKEN_KEY)
    if (profile) sessionStorage.setItem(USER_KEY, JSON.stringify(profile))
    else sessionStorage.removeItem(USER_KEY)
  }, [])

  // 1. Load backend OAuth capability flags and client IDs
  useEffect(() => {
    let active = true
    fetchAuthConfig()
      .then((cfg) => {
        if (active) setConfig(cfg)
      })
      .catch((err) => {
        console.warn('Could not fetch auth configuration from backend:', err?.message || err)
      })
      .finally(() => {
        if (active) setReady(true)
      })
    return () => {
      active = false
    }
  }, [])

  // 2. Validate existing token with /auth/me on mount
  useEffect(() => {
    if (!token) return
    let active = true
    fetchCurrentUser()
      .then((data) => {
        if (active && data?.user) {
          setUser(data.user)
          sessionStorage.setItem(USER_KEY, JSON.stringify(data.user))
        }
      })
      .catch(() => {
        if (active) {
          persistAuth(null, null)
        }
      })
    return () => {
      active = false
    }
  }, [token, persistAuth])

  // Email / Password Sign In
  async function signIn(email, password) {
    setLoading(true)
    try {
      const data = await loginWithEmail(email, password)
      persistAuth(data.token, data.user)
      return data.user
    } finally {
      setLoading(false)
    }
  }

  // Email / Password Sign Up
  async function signUp(name, email, password) {
    setLoading(true)
    try {
      const data = await signupWithEmail(name, email, password)
      persistAuth(data.token, data.user)
      return data.user
    } finally {
      setLoading(false)
    }
  }

  /**
   * Wait for the Google Identity Services SDK to be ready (loaded via async script tag).
   * Polls up to 5 seconds before giving up.
   */
  function _waitForGIS(timeoutMs = 5000) {
    return new Promise((resolve, reject) => {
      if (window.google?.accounts?.oauth2) {
        resolve()
        return
      }
      const start = Date.now()
      const interval = setInterval(() => {
        if (window.google?.accounts?.oauth2) {
          clearInterval(interval)
          resolve()
        } else if (Date.now() - start > timeoutMs) {
          clearInterval(interval)
          reject(new Error('Google SDK failed to load. Please refresh the page and try again.'))
        }
      }, 100)
    })
  }

  /**
   * Real Google Sign-In using Google Identity Services (GIS).
   * Launches the official Google account chooser popup, verifies the token on the backend,
   * creates/updates the user, and signs them in.
   */
  async function signInWithGoogle() {
    setLoading(true)
    try {
      const clientId =
        config.google_client_id ||
        import.meta.env.VITE_GOOGLE_CLIENT_ID ||
        ''

      if (!clientId) {
        throw new Error(
          'Google Sign-In is not configured. Please contact support or try signing in with email.'
        )
      }

      // Wait up to 5s for the GIS script tag to finish loading
      await _waitForGIS()

      const tokenResponse = await new Promise((resolve, reject) => {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'openid email profile',
          callback: (resp) => {
            if (resp.error) {
              reject(new Error(resp.error_description || resp.error))
            } else {
              resolve(resp)
            }
          },
          error_callback: (err) => {
            reject(new Error(err?.message || 'Google Sign-In was cancelled.'))
          },
        })
        client.requestAccessToken({ prompt: 'select_account' })
      })

      const data = await loginWithGoogle({ access_token: tokenResponse.access_token })
      persistAuth(data.token, data.user)
      return data.user
    } finally {
      setLoading(false)
    }
  }

  /**
   * Real GitHub OAuth Sign-In.
   * Redirects browser to backend /auth/github, which handles the OAuth grant with GitHub
   * and returns to /auth/callback?token=...
   */
  function startGitHubOAuth() {
    const apiRoot = getApiRoot()
    const target = apiRoot.startsWith('http')
      ? `${apiRoot.replace(/\/$/, '')}/auth/github`
      : `/auth/github`
    window.location.href = target
  }

  /**
   * Complete GitHub OAuth redirect flow from /auth/callback
   */
  const completeOAuth = useCallback(
    async (jwtToken) => {
      sessionStorage.setItem(TOKEN_KEY, jwtToken)
      setToken(jwtToken)
      const data = await fetchCurrentUser()
      if (data?.user) {
        setUser(data.user)
        sessionStorage.setItem(USER_KEY, JSON.stringify(data.user))
        return data.user
      }
      throw new Error('Could not retrieve user profile.')
    },
    []
  )

  /**
   * Unified provider dispatcher for components
   */
  async function signInWithProvider(provider) {
    if (provider === 'google') {
      return signInWithGoogle()
    }
    if (provider === 'github') {
      startGitHubOAuth()
      return
    }
    throw new Error(`Unsupported provider: ${provider}`)
  }

  function signOut() {
    persistAuth(null, null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        ready,
        loading,
        config,
        signIn,
        signUp,
        signInWithProvider,
        signInWithGoogle,
        startGitHubOAuth,
        completeOAuth,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
