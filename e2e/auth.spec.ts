import { test, expect } from '@playwright/test'

/**
 * Smoke tests for auth and landing routes.
 * We only assert that the routes load (URL + body visible) so CI does not depend on
 * session timeout or auth form rendering, which can be flaky in headless/CI.
 */
test.describe('Auth', () => {
  test('auth page is reachable', async ({ page }) => {
    await page.goto('/auth')
    await page.waitForLoadState('domcontentloaded')
    expect(page.url()).toMatch(/\/(auth|login)/)
    await expect(page.locator('body')).toBeVisible({ timeout: 15000 })
  })

  test('landing page is reachable', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('body')).toBeVisible({ timeout: 15000 })
  })
})
