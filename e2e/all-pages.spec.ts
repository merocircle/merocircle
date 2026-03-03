import { test, expect } from '@playwright/test'

/**
 * Smoke tests for every app page.
 * Each test visits the route and asserts the page loads (or redirects to auth).
 */
test.describe('All pages load', () => {
  test('landing /', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('body')).toBeVisible({ timeout: 15000 })
  })

  test('about /about', async ({ page }) => {
    await page.goto('/about')
    await page.waitForLoadState('domcontentloaded')
    expect(page.url()).toContain('about')
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
  })

  test('auth /auth', async ({ page }) => {
    await page.goto('/auth')
    await page.waitForLoadState('domcontentloaded')
    expect(page.url()).toMatch(/\/(auth|login)/)
    await expect(page.locator('body')).toBeVisible({ timeout: 15000 })
  })

  test('auth callback /auth/callback', async ({ page }) => {
    await page.goto('/auth/callback')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
  })

  test('login /login', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('domcontentloaded')
    expect(page.url()).toMatch(/\/(login|auth)/)
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
  })

  test('signup /signup', async ({ page }) => {
    await page.goto('/signup')
    await page.waitForLoadState('domcontentloaded')
    expect(page.url()).toMatch(/\/(signup|auth)/)
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
  })

  test('signup creator /signup/creator', async ({ page }) => {
    await page.goto('/signup/creator')
    await page.waitForLoadState('domcontentloaded')
    expect(page.url()).toMatch(/\/(signup|auth)/)
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
  })

  test('explore /explore', async ({ page }) => {
    await page.goto('/explore')
    await page.waitForLoadState('domcontentloaded')
    expect(page.url()).toContain('explore')
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
  })

  test('creator by slug /creator/[slug]', async ({ page }) => {
    await page.goto('/creator/test-creator')
    await page.waitForLoadState('domcontentloaded')
    expect(page.url()).toContain('creator')
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
  })

  test('username profile /[username]', async ({ page }) => {
    await page.goto('/testuser')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
  })

  test('home /home', async ({ page }) => {
    await page.goto('/home')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)
    const url = page.url()
    expect(url.includes('home') || url.includes('auth') || url.includes('login')).toBe(true)
    await expect(page.locator('body')).toBeVisible({ timeout: 5000 })
  })

  test('profile /profile', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)
    const url = page.url()
    expect(url.includes('profile') || url.includes('auth') || url.includes('login')).toBe(true)
    await expect(page.locator('body')).toBeVisible({ timeout: 5000 })
  })

  test('settings /settings', async ({ page }) => {
    await page.goto('/settings')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)
    const url = page.url()
    expect(url.includes('settings') || url.includes('auth') || url.includes('login')).toBe(true)
    await expect(page.locator('body')).toBeVisible({ timeout: 5000 })
  })

  test('notifications /notifications', async ({ page }) => {
    await page.goto('/notifications')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)
    const url = page.url()
    expect(url.includes('notifications') || url.includes('auth') || url.includes('login')).toBe(true)
    await expect(page.locator('body')).toBeVisible({ timeout: 5000 })
  })

  test('chat /chat', async ({ page }) => {
    await page.goto('/chat')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)
    const url = page.url()
    expect(url.includes('chat') || url.includes('auth') || url.includes('login')).toBe(true)
    await expect(page.locator('body')).toBeVisible({ timeout: 5000 })
  })

  test('creator studio /creator-studio', async ({ page }) => {
    await page.goto('/creator-studio')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)
    const url = page.url()
    expect(url.includes('creator-studio') || url.includes('auth') || url.includes('login')).toBe(true)
    await expect(page.locator('body')).toBeVisible({ timeout: 5000 })
  })

  test('create post /create-post', async ({ page }) => {
    await page.goto('/create-post')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)
    const url = page.url()
    expect(url.includes('create-post') || url.includes('auth') || url.includes('login')).toBe(true)
    await expect(page.locator('body')).toBeVisible({ timeout: 5000 })
  })

  test('admin /admin', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)
    const url = page.url()
    expect(url.includes('admin') || url.includes('auth') || url.includes('login')).toBe(true)
    await expect(page.locator('body')).toBeVisible({ timeout: 5000 })
  })

  test('payment success /payment/success', async ({ page }) => {
    await page.goto('/payment/success')
    await page.waitForLoadState('domcontentloaded')
    expect(page.url()).toContain('success')
    await expect(page.locator('body')).toBeVisible({ timeout: 5000 })
  })

  test('payment failure /payment/failure', async ({ page }) => {
    await page.goto('/payment/failure')
    await page.waitForLoadState('domcontentloaded')
    expect(page.url()).toContain('failure')
    await expect(page.locator('body')).toBeVisible({ timeout: 5000 })
  })

  test('payment dodo success /payment/dodo/success', async ({ page }) => {
    await page.goto('/payment/dodo/success')
    await page.waitForLoadState('domcontentloaded')
    expect(page.url()).toContain('dodo')
    await expect(page.locator('body')).toBeVisible({ timeout: 5000 })
  })

  test('unsubscribe /unsubscribe', async ({ page }) => {
    await page.goto('/unsubscribe')
    await page.waitForLoadState('domcontentloaded')
    expect(page.url()).toContain('unsubscribe')
    await expect(page.locator('body')).toBeVisible({ timeout: 5000 })
  })
})
