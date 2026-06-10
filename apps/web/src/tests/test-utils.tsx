import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import type { Role, User } from '@educms/shared'
import { AuthContext, type AuthContextValue } from '@/features/auth/auth-context'

export function makeUser(role: Role, overrides: Partial<User> = {}): User {
  return {
    id: 1,
    username: 'tester',
    email: 'tester@educms.local',
    firstName: 'Test',
    lastName: 'User',
    role,
    isActive: true,
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

export function makeAuth(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    loadFailed: false,
    retryLoad: vi.fn(),
    login: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

export function renderWithAuth(
  ui: React.ReactNode,
  auth: AuthContextValue,
  { route = '/' }: { route?: string } = {}
) {
  return render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </AuthContext.Provider>
  )
}
