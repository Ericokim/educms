import { createContext, useContext } from 'react'
import type { LoginPayload, User } from '@educms/shared'

export interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  /** A token exists but the session could not be loaded (server/network error, not 401). */
  loadFailed: boolean
  retryLoad: () => void
  login: (payload: LoginPayload) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
