import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { LoginPage } from '@/features/auth/LoginPage'
import { ApiClientError } from '@/lib/api'
import { makeAuth, renderWithAuth } from './test-utils'

describe('LoginPage', () => {
  it('shows validation errors without calling the API', async () => {
    const auth = makeAuth()
    renderWithAuth(<LoginPage />, auth)

    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument()
    expect(screen.getByText('Password is required')).toBeInTheDocument()
    expect(auth.login).not.toHaveBeenCalled()
  })

  it('submits valid credentials', async () => {
    const auth = makeAuth()
    renderWithAuth(<LoginPage />, auth)

    await userEvent.type(screen.getByLabelText('Email'), 'admin@educms.local')
    await userEvent.type(screen.getByLabelText('Password'), 'Password123!')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() =>
      expect(auth.login).toHaveBeenCalledWith({
        email: 'admin@educms.local',
        password: 'Password123!',
      })
    )
  })

  it('surfaces server rejections as a form error', async () => {
    const auth = makeAuth({
      login: vi.fn().mockRejectedValue(new ApiClientError('Invalid email or password', 401)),
    })
    renderWithAuth(<LoginPage />, auth)

    await userEvent.type(screen.getByLabelText('Email'), 'admin@educms.local')
    await userEvent.type(screen.getByLabelText('Password'), 'wrong')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password')
  })
})
