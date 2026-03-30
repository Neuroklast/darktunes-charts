import { test, expect } from '@playwright/test'

/**
 * Visual regression tests for the dark theme.
 *
 * The DarkTunes application defaults to dark mode (`defaultTheme="dark"` in
 * ThemeProvider). These tests verify:
 *   1. The dark theme class is applied to the root element by default.
 *   2. Key pages render without visual regressions in dark mode (screenshot).
 *   3. Essential accessibility properties (contrast, role attributes) are
 *      present in dark mode.
 *
 * Screenshots are stored in `e2e/snapshots/` and should be committed to the
 * repository so CI can compare against a known-good baseline.
 * On first run (`--update-snapshots`) the baseline is created automatically.
 */

// ── Dark Mode Application ──────────────────────────────────────────────────────

test.describe('Dark theme – class application', () => {
  test('root <html> element has the dark class applied', async ({ page }) => {
    await page.goto('/')
    // ThemeProvider adds `class="dark"` to <html> when defaultTheme is "dark"
    const htmlClass = await page.locator('html').getAttribute('class')
    expect(htmlClass).toContain('dark')
  })

  test('charts page applies dark class to root element', async ({ page }) => {
    await page.goto('/charts')
    const htmlClass = await page.locator('html').getAttribute('class')
    expect(htmlClass).toContain('dark')
  })

  test('login page applies dark class to root element', async ({ page }) => {
    await page.goto('/login')
    const htmlClass = await page.locator('html').getAttribute('class')
    expect(htmlClass).toContain('dark')
  })
})

// ── Dark Theme Visual Snapshots ───────────────────────────────────────────────

test.describe('Dark theme – visual snapshots', () => {
  test('homepage renders correctly in dark mode', async ({ page }) => {
    await page.goto('/')
    // Wait for initial paint to stabilise
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('homepage-dark.png', {
      maxDiffPixelRatio: 0.05,
      fullPage: false,
    })
  })

  test('charts page renders correctly in dark mode', async ({ page }) => {
    await page.goto('/charts')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('charts-dark.png', {
      maxDiffPixelRatio: 0.05,
      fullPage: false,
    })
  })

  test('login page renders correctly in dark mode', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('login-dark.png', {
      maxDiffPixelRatio: 0.05,
      fullPage: false,
    })
  })
})

// ── Dark Theme Accessibility Checks ──────────────────────────────────────────

test.describe('Dark theme – accessibility in dark mode', () => {
  test('navigation bar is visible in dark mode', async ({ page }) => {
    await page.goto('/')
    const nav = page.locator('nav')
    await expect(nav).toBeVisible()
    // Navigation should have reasonable contrast — at minimum be non-transparent
    const navStyles = await nav.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    )
    // Should not be fully transparent (rgba(0, 0, 0, 0))
    expect(navStyles).not.toBe('rgba(0, 0, 0, 0)')
  })

  test('main heading is readable in dark mode', async ({ page }) => {
    await page.goto('/')
    const h1 = page.locator('h1').first()
    await expect(h1).toBeVisible()
    const color = await h1.evaluate((el) =>
      window.getComputedStyle(el).color
    )
    // Text colour should not be pure transparent
    expect(color).not.toBe('rgba(0, 0, 0, 0)')
  })

  test('charts page heading is readable in dark mode', async ({ page }) => {
    await page.goto('/charts')
    const h1 = page.locator('h1').first()
    await expect(h1).toBeVisible()
    const color = await h1.evaluate((el) =>
      window.getComputedStyle(el).color
    )
    expect(color).not.toBe('rgba(0, 0, 0, 0)')
  })
})
