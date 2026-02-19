import { test, expect } from '@playwright/test'

test.describe('Auth', () => {
  test('auth page loads and shows sign in', async ({ page }) => {
    await page.goto('/auth')
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible({ timeout: 10000 })
  })

  test('auth page has Google sign in option', async ({ page }) => {
    await page.goto('/auth')
    await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible({ timeout: 10000 })
  })

  test('landing page loads when not authenticated', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=Join').or(page.locator('text=Creator')).first()).toBeVisible({ timeout: 15000 })
  })
})
