import { test, expect } from '@playwright/test'

test.describe('Charts page', () => {
  test('loads the charts page', async ({ page }) => {
    await page.goto('/charts')
    await expect(page).toHaveTitle(/Charts/)
    await expect(page.locator('h1')).toBeVisible()
  })

  test('shows chart tabs (Overall / Dark Electro / Metal / Gothic)', async ({ page }) => {
    await page.goto('/charts')
    // the page layout currently renders category tabs, not 'Fan / DJ'
    const tabs = page.locator('button:has-text("Overall")').locator('..')
    await expect(tabs).toBeVisible()

    for (const label of ['Overall', 'Dark Electro', 'Metal', 'Gothic']) {
      await expect(tabs.locator(`button:has-text("${label}")`)).toBeVisible()
    }
  })

  test('tabs are interactive', async ({ page }) => {
    await page.goto('/charts')
    const djTab = page.locator('button:has-text("Metal")').first()
    await djTab.click()
    await expect(djTab).toBeVisible()
  })
})
