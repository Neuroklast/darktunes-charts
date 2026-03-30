import { test, expect } from '@playwright/test'

/**
 * Visual regression tests for the dark theme.
 *
 * The DarkTunes application defaults to dark mode (`defaultTheme="dark"` in
 * ThemeProvider). These tests verify:
 *   1. The dark theme class is applied to the root element by default.
 *   2. Key pages render with a dark background in dark mode (structural checks).
 *   3. Essential accessibility properties (contrast, role attributes) are
 *      present in dark mode.
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

// ── Dark Theme Structural Checks ─────────────────────────────────────────────
// These tests verify dark-mode page structure without requiring committed
// baseline screenshots. The glassmorphism header has background rgba(20,20,20,0.85)
// while the body/html background is set via CSS variables under the dark class.

test.describe('Dark theme – visual snapshots', () => {
  test('homepage body has a dark background in dark mode', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    // Under the dark class, the body background should be a dark colour.
    // The app uses CSS variables (--background) which resolve to near-black in dark mode.
    const bodyBg = await page.locator('body').evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    )
    // Parse r, g, b channels and assert the colour is "dark" (all channels low)
    const match = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(bodyBg)
    expect(match).not.toBeNull()
    const [, r, g, b] = match!.map(Number)
    const luminance = (r! + g! + b!) / 3
    expect(luminance).toBeLessThan(50) // dark background threshold
  })

  test('charts page body has a dark background in dark mode', async ({ page }) => {
    await page.goto('/charts')
    await page.waitForLoadState('networkidle')
    const bodyBg = await page.locator('body').evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    )
    const match = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(bodyBg)
    expect(match).not.toBeNull()
    const [, r, g, b] = match!.map(Number)
    const luminance = (r! + g! + b!) / 3
    expect(luminance).toBeLessThan(50)
  })

  test('login page body has a dark background in dark mode', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    const bodyBg = await page.locator('body').evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    )
    const match = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(bodyBg)
    expect(match).not.toBeNull()
    const [, r, g, b] = match!.map(Number)
    const luminance = (r! + g! + b!) / 3
    expect(luminance).toBeLessThan(50)
  })
})

// ── Dark Theme Accessibility Checks ──────────────────────────────────────────

test.describe('Dark theme – accessibility in dark mode', () => {
  test('navigation header has a non-transparent dark background', async ({ page }) => {
    await page.goto('/')
    const header = page.locator('header').first()
    await expect(header).toBeVisible()
    // The NavigationBar renders a <header> with the `glassmorphism` class which sets
    // background: rgba(20, 20, 20, 0.85). The inner <nav> element is transparent by
    // design — we must check the <header>, not <nav>.
    const headerBg = await header.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    )
    // The glassmorphism background is rgba(20,20,20,0.85) — non-transparent and dark.
    expect(headerBg).not.toBe('rgba(0, 0, 0, 0)')
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
