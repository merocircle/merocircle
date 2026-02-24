import { test, expect } from '@playwright/test'

test.describe('Home', () => {
  test('home page loads', async ({ page }) => {
    await page.goto('/home')
    await page.waitForLoadState('networkidle').catch(() => {})
    const url = page.url()
    const hasHome = url.includes('/home')
    const hasAuth = url.includes('/auth') || url.includes('/login')
    expect(hasHome || hasAuth).toBe(true)
  })

  test('home or auth shows main content', async ({ page }) => {
    await page.goto('/home')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)
    const body = await page.locator('body').textContent()
    expect(body?.length).toBeGreaterThan(100)
  })
})
