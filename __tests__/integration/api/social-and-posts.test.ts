import { describe, it, expect } from 'vitest'

const BASE = 'http://localhost:3000'

describe('API integration: social and post like', () => {
  it('POST /api/social/like returns success', async () => {
    const res = await fetch(`${BASE}/api/social/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId: 'post-1' }),
    })
    expect(res.ok).toBe(true)
    const data = await res.json()
    expect(data).toHaveProperty('success', true)
  })

  it('GET /api/posts/:id returns post shape', async () => {
    const res = await fetch(`${BASE}/api/posts/post-1`)
    expect(res.ok).toBe(true)
    const data = await res.json()
    expect(data).toHaveProperty('id')
    expect(data).toHaveProperty('content')
    expect(data).toHaveProperty('creator_id')
  })

  it('POST /api/posts/:id/like returns success', async () => {
    const res = await fetch(`${BASE}/api/posts/post-1/like`, { method: 'POST' })
    expect(res.ok).toBe(true)
    const data = await res.json()
    expect(data).toHaveProperty('success', true)
  })
})
