import { describe, it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/supabase/server', () => {
  let currentTable = ''
  const chain = () => ({
    from: (t: string) => {
      currentTable = t
      return chain()
    },
    select: () => chain(),
    eq: () => chain(),
    in: () => (currentTable === 'posts' ? chain() : Promise.resolve({ data: [], error: null })),
    order: () => chain(),
    limit: () => Promise.resolve({ data: [], error: null }),
  })
  return { createClient: () => Promise.resolve(chain()) }
})

vi.mock('@/lib/api-utils', () => ({
  getAuthenticatedUser: () =>
    Promise.resolve({
      user: { id: 'test-user', email: 'test@example.com', name: 'Test' },
      errorResponse: null,
    }),
  handleApiError: (err: unknown, _ctx: string, msg: string) => {
    const e = err instanceof Error ? err : new Error(String(err))
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  },
}))

describe('API route: GET /api/notifications', () => {
  it('returns 200 and notifications array when authenticated', async () => {
    const { GET } = await import('@/app/api/notifications/route')
    const req = new NextRequest('http://localhost:3000/api/notifications')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('notifications')
    expect(Array.isArray(body.notifications)).toBe(true)
  })
})
