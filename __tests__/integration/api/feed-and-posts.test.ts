import { describe, it, expect } from 'vitest'

const BASE = 'http://localhost:3000'

describe('API integration: feed and posts', () => {
  it('GET /api/dashboard/unified-feed returns posts array', async () => {
    const res = await fetch(`${BASE}/api/dashboard/unified-feed`)
    expect(res.ok).toBe(true)
    const data = await res.json()
    expect(data).toHaveProperty('posts')
    expect(Array.isArray(data.posts)).toBe(true)
  })

  it('GET /api/posts returns posts and pagination', async () => {
    const res = await fetch(`${BASE}/api/posts`)
    expect(res.ok).toBe(true)
    const data = await res.json()
    expect(data).toHaveProperty('posts')
    expect(Array.isArray(data.posts)).toBe(true)
    expect(data).toMatchObject({ posts: [], nextPage: null })
  })

  it('GET /api/dashboard/discover returns creators', async () => {
    const res = await fetch(`${BASE}/api/dashboard/discover`)
    expect(res.ok).toBe(true)
    const data = await res.json()
    expect(data).toHaveProperty('creators')
    expect(Array.isArray(data.creators)).toBe(true)
  })
})
