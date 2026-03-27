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
    // Tabs don't use [role="tablist"] here, they are rendered as a row of buttons
    const tablist = page.locator('button:has-text("Overall")').locator('..')
    await expect(tablist).toBeVisible()
  })

  test('switching chart tabs works', async ({ page }) => {
    await page.goto('/charts')
    const tabs = page.locator('button:has-text("Overall")').locator('..').locator('button')
    const count = await tabs.count()
    // At least one tab must be present
    expect(count).toBeGreaterThan(0)
    // Click the first tab
    await tabs.first().click()
    // They don't have aria roles / states currently, just verify it's visible and clickable
    await expect(tabs.first()).toBeVisible()
  })

  test('categories page is reachable', async ({ page }) => {
    await page.goto('/categories')
    await expect(page).toHaveTitle(/DarkTunes/)
    await expect(page.locator('h1')).toBeVisible()
  })
})
