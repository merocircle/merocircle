import { describe, it, expect } from 'vitest'

const BASE = 'http://localhost:3000'

describe('API integration: creator and notifications', () => {
  it('GET /api/creator/:id returns creator profile shape', async () => {
    const res = await fetch(`${BASE}/api/creator/creator-123`)
    expect(res.ok).toBe(true)
    const data = await res.json()
    expect(data).toHaveProperty('id')
    expect(data).toHaveProperty('user_id')
    expect(data).toHaveProperty('vanity_username')
    expect(data).toHaveProperty('bio')
    expect(data).toHaveProperty('category')
  })

  it('GET /api/notifications returns notifications array', async () => {
    const res = await fetch(`${BASE}/api/notifications`)
    expect(res.ok).toBe(true)
    const data = await res.json()
    expect(data).toHaveProperty('notifications')
    expect(Array.isArray(data.notifications)).toBe(true)
  })

  it('GET /api/creator/tiers returns tiers array', async () => {
    const res = await fetch(`${BASE}/api/creator/tiers`)
    expect(res.ok).toBe(true)
    const data = await res.json()
    expect(data).toHaveProperty('tiers')
    expect(Array.isArray(data.tiers)).toBe(true)
  })
})
