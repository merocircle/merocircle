import { test, expect } from '@playwright/test'

test.describe('Payments', () => {
  test('payment success page loads', async ({ page }) => {
    await page.goto('/payment/success')
    await page.waitForLoadState('domcontentloaded')
    const body = await page.locator('body').textContent()
    expect(body?.length).toBeGreaterThan(50)
  })

  test('payment failure page loads', async ({ page }) => {
    await page.goto('/payment/failure')
    await page.waitForLoadState('domcontentloaded')
    const body = await page.locator('body').textContent()
    expect(body?.length).toBeGreaterThan(50)
  })
})
