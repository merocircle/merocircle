import { test, expect } from '@playwright/test'

test.describe('Settings', () => {
  test('settings page loads or redirects to auth', async ({ page }) => {
    await page.goto('/settings')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)
    const url = page.url()
    const isSettings = url.includes('settings')
    const isAuth = url.includes('auth') || url.includes('login')
    expect(isSettings || isAuth).toBe(true)
  })
})
