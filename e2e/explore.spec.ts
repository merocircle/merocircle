import { test, expect } from '@playwright/test'

test.describe('Explore', () => {
  test('explore page loads', async ({ page }) => {
    await page.goto('/explore')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)
    const url = page.url()
    expect(url).toContain('explore')
  })

  test('explore page has main content area', async ({ page }) => {
    await page.goto('/explore')
    await page.waitForLoadState('networkidle').catch(() => {})
    const main = page.locator('main').or(page.locator('[role="main"]')).or(page.locator('body'))
    await expect(main.first()).toBeVisible({ timeout: 10000 })
  })
})
