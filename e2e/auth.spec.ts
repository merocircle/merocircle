import { test, expect } from '@playwright/test'

// In CI, session can take a while to resolve; use longer timeouts for auth-dependent pages.
const AUTH_PAGE_TIMEOUT = 25_000
const LANDING_TIMEOUT = 25_000

test.describe('Auth', () => {
  test('auth page loads and shows sign in', async ({ page }) => {
    await page.goto('/auth')
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible({ timeout: AUTH_PAGE_TIMEOUT })
  })

  test('auth page has Google sign in option', async ({ page }) => {
    await page.goto('/auth')
    await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible({ timeout: AUTH_PAGE_TIMEOUT })
  })

  test('landing page loads when not authenticated', async ({ page }) => {
    await page.goto('/')
    // Use main-content selector: "Get Started" link in hero/nav (avoids matching hidden <title> text like "Creator")
    await expect(page.getByRole('link', { name: /get started/i }).first()).toBeVisible({ timeout: LANDING_TIMEOUT })
  })
})
