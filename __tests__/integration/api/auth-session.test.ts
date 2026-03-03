import { describe, it, expect } from 'vitest'

const BASE = 'http://localhost:3000'

describe('API integration: auth session', () => {
  it('GET /api/auth/session returns session shape', async () => {
    const res = await fetch(`${BASE}/api/auth/session`)
    expect(res.ok).toBe(true)
    const data = await res.json()
    expect(data).toHaveProperty('user')
    expect(data.user).toHaveProperty('id')
    expect(data.user).toHaveProperty('email')
    expect(data).toHaveProperty('expires')
  })
})
