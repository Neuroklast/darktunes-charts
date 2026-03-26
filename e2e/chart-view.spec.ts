import { test, expect } from '@playwright/test'

test.describe('Chart view', () => {
  test('public charts page loads', async ({ page }) => {
    await page.goto('/charts')
    await expect(page).toHaveTitle(/DarkTunes/)
  })

  test('charts page has visible heading', async ({ page }) => {
    await page.goto('/charts')
    await expect(page.locator('h1')).toBeVisible()
  })

  test('charts page shows tab navigation', async ({ page }) => {
    await page.goto('/charts')
    const tablist = page.locator('[role="tablist"]')
    await expect(tablist).toBeVisible()
  })

  test('switching chart tabs works', async ({ page }) => {
    await page.goto('/charts')
    const tabs = page.locator('[role="tab"]')
    const count = await tabs.count()
    // At least one tab must be present
    expect(count).toBeGreaterThan(0)
    // Click the first tab and verify it becomes active
    await tabs.first().click()
    await expect(tabs.first()).toHaveAttribute('data-state', 'active')
  })

  test('categories page is reachable', async ({ page }) => {
    await page.goto('/categories')
    await expect(page).toHaveTitle(/DarkTunes/)
    await expect(page.locator('h1')).toBeVisible()
  })
})
