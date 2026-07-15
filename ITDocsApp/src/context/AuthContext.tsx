import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { authApi, type UserDto } from '../api/auth'
import { setUnauthorizedHandler } from '../api/http'
import type { OrganizationSummary } from '../api/types'

interface AuthContextValue {
  user: UserDto | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token')
    setUser(null)
  }, [])

  // Global 401 handler — any API call anywhere in the app that comes back
  // unauthorized drops the session, no matter which component triggered it.
  useEffect(() => {
    setUnauthorizedHandler(() => logout())
  }, [logout])

  // On mount, if a token is already stored, validate it against /auth/me
  // rather than trusting it blindly (it may have expired since last visit).
  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      setIsLoading(false)
      return
    }
    authApi.me()
      .then(setUser)
      .catch(() => localStorage.removeItem('auth_token'))
      .finally(() => setIsLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password)
    localStorage.setItem('auth_token', res.token)
    setUser(res.user)
  }, [])

  const register = useCallback(async (email: string, password: string, displayName: string) => {
    const res = await authApi.register(email, password, displayName)
    localStorage.setItem('auth_token', res.token)
    setUser(res.user)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// Re-exported for AppProvider's org list, since organizations now come
// from GET /api/organizations rather than the login response.
export type { OrganizationSummary }