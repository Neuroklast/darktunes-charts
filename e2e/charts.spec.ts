import { test, expect } from '@playwright/test'

test.describe('Charts page', () => {
  test('loads the charts page', async ({ page }) => {
    await page.goto('/charts')
    await expect(page).toHaveTitle(/Charts/)
    await expect(page.locator('h1')).toBeVisible()
  })

  test('shows chart tabs (Fan / DJ / Band / Combined)', async ({ page }) => {
    await page.goto('/charts')
    const tabs = page.locator('[role="tablist"]')
    await expect(tabs).toBeVisible()

    for (const label of ['Fan', 'DJ', 'Band', 'Combined']) {
      await expect(tabs.locator(`[role="tab"]:has-text("${label}")`)).toBeVisible()
    }
  })

  test('tabs are interactive', async ({ page }) => {
    await page.goto('/charts')
    const djTab = page.locator('[role="tab"]:has-text("DJ")').first()
    await djTab.click()
    await expect(djTab).toHaveAttribute('data-state', 'active')
  })
})
