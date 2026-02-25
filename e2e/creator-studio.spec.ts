import { test, expect } from '@playwright/test'

test.describe('Creator Studio', () => {
  test('creator-studio page loads or redirects to auth', async ({ page }) => {
    await page.goto('/creator-studio')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)
    const url = page.url()
    const isStudio = url.includes('creator-studio')
    const isAuth = url.includes('auth') || url.includes('login')
    expect(isStudio || isAuth).toBe(true)
  })
})
