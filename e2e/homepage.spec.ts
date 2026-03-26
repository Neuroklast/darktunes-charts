import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('loads and shows hero content', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/DarkTunes/)
    await expect(page.locator('h1')).toBeVisible()
  })

  test('has navigation links', async ({ page }) => {
    await page.goto('/')
    const nav = page.locator('nav')
    await expect(nav).toBeVisible()
    const chartsLink = nav.locator('a[href*="charts"]')
    await expect(chartsLink).toBeVisible()
  })

  test('has Call-to-Action buttons', async ({ page }) => {
    await page.goto('/')
    const links = page.locator('a')
    await expect(links.first()).toBeVisible()
  })
})
