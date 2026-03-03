import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthContextProvider } from '@/contexts/auth-context'
import { setMockSession, defaultMockSession, type MockSession } from './auth'

const defaultQueryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

/**
 * Wrap a component with app providers (Query + Auth context).
 * Use this when testing components that use useSession, useAuth, or React Query.
 */
export function withAllProviders(ui: React.ReactElement, queryClient?: QueryClient) {
  const client = queryClient ?? defaultQueryClient
  return (
    <QueryClientProvider client={client}>
      <AuthContextProvider>{ui}</AuthContextProvider>
    </QueryClientProvider>
  )
}

/**
 * Set authenticated session and optionally wrap with providers.
 * Call setMockSession(defaultMockSession) (or your session) before rendering
 * so useSession() and AuthContext see a logged-in user.
 *
 * @example
 *   setMockSession(defaultMockSession)
 *   render(withAllProviders(<MyComponent />))
 */
export function renderWithAuth(
  ui: React.ReactElement,
  session: MockSession | null = defaultMockSession,
  options?: { queryClient?: QueryClient }
) {
  setMockSession(session)
  return withAllProviders(ui, options?.queryClient)
}
