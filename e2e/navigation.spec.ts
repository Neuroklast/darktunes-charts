import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('navigation links are present and accessible', async ({ page }) => {
    await page.goto('/')
    const nav = page.locator('nav')
    await expect(nav).toBeVisible()
  })

  test('locale switcher is present in navigation', async ({ page }) => {
    await page.goto('/')
    // LocaleSwitcher renders a button or select for language switching
    const localeSwitcher = page
      .locator('[aria-label*="Sprache"], [aria-label*="language"], button:has-text("DE"), button:has-text("EN")')
      .first()
    await expect(localeSwitcher).toBeVisible()
  })

  test('navigating to charts works', async ({ page }) => {
    await page.goto('/')
    await page.locator('nav a[href*="charts"]').first().click()
    await expect(page).toHaveURL(/.*charts/)
  })

  test('navigating to how-it-works works', async ({ page }) => {
    await page.goto('/')
    const howItWorksLink = page.locator('a[href*="how-it-works"]').first()
    await expect(howItWorksLink).toBeVisible()
    await howItWorksLink.click()
    await expect(page).toHaveURL(/.*how-it-works/)
  })
})
