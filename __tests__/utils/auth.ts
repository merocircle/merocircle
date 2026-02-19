/** Session shape that next-auth useSession().data has */
export interface MockSession {
  user: {
    id: string
    email: string
    name?: string | null
    image?: string | null
  }
  expires: string
}

const DEFAULT_AUTH_USER: MockSession['user'] = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  image: null,
}

/** Default session for authenticated tests */
export const defaultMockSession: MockSession = {
  user: DEFAULT_AUTH_USER,
  expires: '2099-01-01',
}

let mockSession: MockSession | null = null

export function getMockSession(): MockSession | null {
  return mockSession
}

/**
 * Set the mock session for next-auth useSession() in tests.
 * Call with null to simulate unauthenticated state.
 * Cleared automatically in afterEach (see setup.ts).
 */
export function setMockSession(session: MockSession | null): void {
  mockSession = session
}

/**
 * Reset mock session to unauthenticated. Called in afterEach.
 */
export function clearMockSession(): void {
  mockSession = null
}

