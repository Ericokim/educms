import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ROLES } from '@educms/shared'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { RequireRole } from '@/features/auth/RequireRole'
import { makeAuth, makeUser, renderWithAuth } from './test-utils'

function protectedApp() {
  return (
    <Routes>
      <Route path="/login" element={<p>Login screen</p>} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<p>Secret dashboard</p>} />
      </Route>
    </Routes>
  )
}

describe('ProtectedRoute', () => {
  it('redirects unauthenticated visitors to the login page', () => {
    renderWithAuth(protectedApp(), makeAuth())

    expect(screen.getByText('Login screen')).toBeInTheDocument()
    expect(screen.queryByText('Secret dashboard')).not.toBeInTheDocument()
  })

  it('shows a session spinner while loading', () => {
    renderWithAuth(protectedApp(), makeAuth({ isLoading: true }))

    expect(screen.getByText(/checking your session/i)).toBeInTheDocument()
  })

  it('shows a retry screen on load failure instead of logging out', () => {
    renderWithAuth(protectedApp(), makeAuth({ loadFailed: true }))

    expect(screen.getByText(/can’t reach the server/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    expect(screen.queryByText('Login screen')).not.toBeInTheDocument()
  })

  it('renders the protected content when authenticated', () => {
    renderWithAuth(
      protectedApp(),
      makeAuth({ isAuthenticated: true, user: makeUser(ROLES.ADMIN) })
    )

    expect(screen.getByText('Secret dashboard')).toBeInTheDocument()
  })
})

describe('RequireRole', () => {
  it('blocks users without the required role', () => {
    renderWithAuth(
      <RequireRole roles={[ROLES.ADMIN]}>
        <p>Admin tools</p>
      </RequireRole>,
      makeAuth({ isAuthenticated: true, user: makeUser(ROLES.AUTHOR) })
    )

    expect(screen.getByText('Access denied')).toBeInTheDocument()
    expect(screen.queryByText('Admin tools')).not.toBeInTheDocument()
  })

  it('renders children for permitted roles', () => {
    renderWithAuth(
      <RequireRole roles={[ROLES.ADMIN, ROLES.EDITOR]}>
        <p>Admin tools</p>
      </RequireRole>,
      makeAuth({ isAuthenticated: true, user: makeUser(ROLES.EDITOR) })
    )

    expect(screen.getByText('Admin tools')).toBeInTheDocument()
  })
})
