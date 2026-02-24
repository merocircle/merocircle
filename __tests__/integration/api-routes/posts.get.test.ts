import { describe, it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/supabase/server', () => {
  const rangeResult = Promise.resolve({ data: [], error: null })
  const countResult = Promise.resolve({ count: 0, error: null })
  let currentTable = ''
  const chain = () => ({
    from: (t: string) => {
      currentTable = t
      return chain()
    },
    select: (_c?: unknown, opts?: { count?: string; head?: boolean }) =>
      opts?.count === 'exact' && opts?.head ? { eq: () => countResult } : chain(),
    eq: () => chain(),
    in: () =>
      currentTable === 'posts' ? chain() : Promise.resolve({ data: [], error: null }),
    order: () => chain(),
    range: () => rangeResult,
  })
  return {
    createClient: () => Promise.resolve(chain()),
  }
})

describe('API route: GET /api/posts', () => {
  it('returns 200 and empty posts when no data', async () => {
    const { GET } = await import('@/app/api/posts/route')
    const req = new NextRequest('http://localhost:3000/api/posts')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('posts')
    expect(Array.isArray(body.posts)).toBe(true)
    expect(body.posts).toHaveLength(0)
    expect(body).toHaveProperty('pagination')
    expect(body.pagination).toMatchObject({ page: 1, limit: 10, total: 0, totalPages: 0 })
  })

  it('returns pagination from query params', async () => {
    const { GET } = await import('@/app/api/posts/route')
    const req = new NextRequest('http://localhost:3000/api/posts?page=2&limit=5')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.pagination).toMatchObject({ page: 2, limit: 5 })
  })
})
