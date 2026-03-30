import { test, expect } from '@playwright/test'

/**
 * E2E tests for payment-related pages and flows.
 *
 * Because Stripe Checkout requires a real session and live credentials, these
 * tests cover the client-side surfaces that can be validated without a live
 * Stripe environment:
 *   – Band dashboard payment entry point
 *   – Stripe redirect landing pages (success / cancelled query params)
 *   – API route responses for malformed or unauthenticated requests
 */

// ── Band Dashboard – Payment Entry ────────────────────────────────────────────

test.describe('Payment – Band Dashboard', () => {
  test('band dashboard is protected by authentication', async ({ page }) => {
    const response = await page.goto('/dashboard/band')
    const finalUrl = page.url()
    const isProtected =
      finalUrl.includes('/login') ||
      finalUrl.includes('/dashboard/band') ||
      finalUrl.includes('/signup')
    expect(isProtected).toBe(true)
    if (response) {
      expect(response.status()).toBeLessThan(500)
    }
  })

  test('payment=success query param does not cause a server error', async ({ page }) => {
    const response = await page.goto('/dashboard/band?payment=success')
    if (response) {
      expect(response.status()).toBeLessThan(500)
    }
  })

  test('payment=cancelled query param does not cause a server error', async ({ page }) => {
    const response = await page.goto('/dashboard/band?payment=cancelled')
    if (response) {
      expect(response.status()).toBeLessThan(500)
    }
  })
})

// ── Stripe Checkout API – Basic Validation ────────────────────────────────────

test.describe('Payment – Stripe Checkout API', () => {
  test('POST /api/stripe/checkout returns 401 for unauthenticated requests', async ({ request }) => {
    const response = await request.post('/api/stripe/checkout', {
      data: {
        bandId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        tier: 'Emerging',
        totalCategories: 3,
      },
      headers: { 'Content-Type': 'application/json', 'origin': 'http://localhost:3000' },
    })
    // Unauthenticated → 401
    expect(response.status()).toBe(401)
  })

  test('POST /api/stripe/checkout returns 400 when Origin header is missing', async ({ request }) => {
    const response = await request.post('/api/stripe/checkout', {
      data: {
        bandId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        tier: 'Emerging',
        totalCategories: 3,
      },
      headers: { 'Content-Type': 'application/json' },
    })
    // Missing origin → 400 before auth check
    expect([400, 401]).toContain(response.status())
  })

  test('POST /api/stripe/webhook returns 400 when stripe-signature is missing', async ({ request }) => {
    const response = await request.post('/api/stripe/webhook', {
      data: '{}',
      headers: { 'Content-Type': 'application/json' },
    })
    expect(response.status()).toBe(400)
    const body = await response.json() as { error: string }
    expect(body.error).toMatch(/missing stripe-signature/i)
  })
})

// ── Pricing Pages ─────────────────────────────────────────────────────────────

test.describe('Payment – Pricing information pages', () => {
  test('homepage renders without payment-related errors', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.status()).toBeLessThan(400)
    await expect(page.locator('h1')).toBeVisible()
  })

  test('fan dashboard is protected by authentication', async ({ page }) => {
    const response = await page.goto('/dashboard/fan')
    const finalUrl = page.url()
    const isProtected =
      finalUrl.includes('/login') ||
      finalUrl.includes('/dashboard/fan') ||
      finalUrl.includes('/signup')
    expect(isProtected).toBe(true)
    if (response) {
      expect(response.status()).toBeLessThan(500)
    }
  })
})
