import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { StatusBadge } from '@/components/shared/StatusBadge'

describe('StatusBadge', () => {
  it.each(['published', 'draft', 'archived', 'pending', 'approved', 'spam', 'trash'] as const)(
    'renders the %s status',
    (status) => {
      render(<StatusBadge status={status} />)
      expect(screen.getByText(status)).toBeInTheDocument()
    }
  )
})

describe('EmptyState', () => {
  it('renders title, description, and children', () => {
    render(
      <EmptyState title="Nothing here" description="Add something first.">
        <button>Add</button>
      </EmptyState>
    )
    expect(screen.getByText('Nothing here')).toBeInTheDocument()
    expect(screen.getByText('Add something first.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument()
  })
})

describe('ErrorState', () => {
  it('calls onRetry when the retry button is clicked', async () => {
    const onRetry = vi.fn()
    render(<ErrorState message="Load failed." onRetry={onRetry} />)

    expect(screen.getByText('Load failed.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(onRetry).toHaveBeenCalledOnce()
  })
})
