import '@testing-library/jest-dom'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'
import { server } from './mocks/server'
import { clearMockSession, getMockSession } from './utils/auth'

vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: getMockSession(),
    status: getMockSession() ? 'authenticated' : 'unauthenticated',
    update: vi.fn(),
  }),
  SessionProvider: ({ children }: { children: unknown }) => children,
  signIn: vi.fn(),
  signOut: vi.fn(),
  getSession: () => Promise.resolve(getMockSession()),
  getCsrfToken: () => Promise.resolve('mock-csrf'),
}))

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => {
  server.resetHandlers()
  clearMockSession()
})
afterAll(() => server.close())
