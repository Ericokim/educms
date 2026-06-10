import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { LoginPayload } from '@educms/shared'
import { ApiClientError } from '@/lib/api'
import { clearToken, hasToken, setToken, subscribeToken } from '@/lib/auth-token'
import { fetchMe, loginRequest, logoutRequest } from './api'
import { AuthContext, type AuthContextValue } from './auth-context'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const tokenPresent = useSyncExternalStore(subscribeToken, hasToken)

  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        return await fetchMe()
      } catch (error) {
        // A stored token the server rejects (expired, revoked, deactivated
        // account) is useless: drop it so the app lands on the login page.
        if (error instanceof ApiClientError && error.status === 401) {
          clearToken()
        }
        throw error
      }
    },
    enabled: tokenPresent,
    // Retry transient failures, but a 401 is final (the token was cleared).
    retry: (failureCount, error) =>
      !(error instanceof ApiClientError && error.status === 401) && failureCount < 2,
    staleTime: 5 * 60 * 1000,
  })

  const login = useCallback(
    async (payload: LoginPayload) => {
      const data = await loginRequest(payload)
      queryClient.setQueryData(['auth', 'me'], data.user)
      setToken(data.token)
    },
    [queryClient]
  )

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } catch {
      // Logging out locally must succeed even if the server is unreachable.
    }
    clearToken()
    queryClient.clear()
  }, [queryClient])

  const { refetch } = meQuery
  const retryLoad = useCallback(() => {
    void refetch()
  }, [refetch])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: meQuery.data ?? null,
      isAuthenticated: tokenPresent && !!meQuery.data,
      isLoading: tokenPresent && meQuery.isPending,
      loadFailed: tokenPresent && meQuery.isError,
      retryLoad,
      login,
      logout,
    }),
    [meQuery.data, meQuery.isPending, meQuery.isError, tokenPresent, retryLoad, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
