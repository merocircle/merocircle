import { describe, it, expect } from 'vitest'
import { cn, formatCurrency, slugifyDisplayName, getValidAvatarUrl } from '@/lib/utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', true && 'visible')).toContain('visible')
    expect(cn('base', false && 'hidden', true && 'visible')).not.toContain('hidden')
  })
})

describe('formatCurrency', () => {
  it('formats number as NPR currency', () => {
    const formatted = formatCurrency(1000)
    expect(formatted.length).toBeGreaterThan(0)
    expect(formatted).toMatch(/Rs|रु|NPR|नेरू/i)
  })

  it('handles zero', () => {
    expect(formatCurrency(0)).toBeDefined()
  })
})

describe('slugifyDisplayName', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(slugifyDisplayName('John Doe')).toBe('john-doe')
  })

  it('trims and removes leading/trailing hyphens', () => {
    expect(slugifyDisplayName('  Hello World  ')).toBe('hello-world')
  })

  it('replaces multiple non-alphanumeric chars with single hyphen', () => {
    expect(slugifyDisplayName('a___b')).toBe('a-b')
  })
})

describe('getValidAvatarUrl', () => {
  it('returns undefined for null or empty', () => {
    expect(getValidAvatarUrl(null)).toBeUndefined()
    expect(getValidAvatarUrl('')).toBeUndefined()
    expect(getValidAvatarUrl('   ')).toBeUndefined()
  })

  it('returns undefined for placeholder paths', () => {
    expect(getValidAvatarUrl('/undefined')).toBeUndefined()
    expect(getValidAvatarUrl('null')).toBeUndefined()
  })

  it('returns valid URL as-is', () => {
    const url = 'https://example.com/avatar.png'
    expect(getValidAvatarUrl(url)).toBe(url)
  })
})
