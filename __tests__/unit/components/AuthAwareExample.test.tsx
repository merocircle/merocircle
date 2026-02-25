import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { setMockSession, defaultMockSession, clearMockSession } from '@/__tests__/utils/auth'
import { withAllProviders } from '@/__tests__/utils/test-wrappers'

function ShowUserEmail() {
  const { data: session, status } = useSession()
  if (status === 'loading') return <span>Loading...</span>
  if (!session?.user?.email) return <span>Not signed in</span>
  return <span>Signed in as {session.user.email}</span>
}

describe('Auth in tests', () => {
  it('shows unauthenticated when no mock session is set', () => {
    clearMockSession()
    render(withAllProviders(<ShowUserEmail />))
    expect(screen.getByText('Not signed in')).toBeInTheDocument()
  })

  it('shows user email when mock session is set', () => {
    setMockSession(defaultMockSession)
    render(withAllProviders(<ShowUserEmail />))
    expect(screen.getByText(/Signed in as test@example\.com/)).toBeInTheDocument()
  })
})
