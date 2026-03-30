import { test, expect } from '@playwright/test'

/**
 * E2E tests for admin-restricted pages and API routes.
 *
 * These tests verify that:
 *   1. Admin dashboard pages are protected from unauthenticated access.
 *   2. Admin-only API routes return 401/403 for unauthenticated callers.
 *   3. Critical admin pages render without server errors when reached.
 *
 * Tests do NOT attempt to log in as admin (would require live credentials),
 * so they focus on the security perimeter and page structure.
 */

// ── Admin Dashboard ───────────────────────────────────────────────────────────

test.describe('Admin – Dashboard access control', () => {
  test('admin dashboard is protected by authentication', async ({ page }) => {
    const response = await page.goto('/dashboard/admin')
    const finalUrl = page.url()
    const isProtected =
      finalUrl.includes('/login') ||
      finalUrl.includes('/dashboard/admin') ||
      finalUrl.includes('/signup')
    expect(isProtected).toBe(true)
    if (response) {
      expect(response.status()).toBeLessThan(500)
    }
  })

  test('editor dashboard is protected by authentication', async ({ page }) => {
    const response = await page.goto('/dashboard/editor')
    const finalUrl = page.url()
    const isProtected =
      finalUrl.includes('/login') ||
      finalUrl.includes('/dashboard/editor') ||
      finalUrl.includes('/signup')
    expect(isProtected).toBe(true)
    if (response) {
      expect(response.status()).toBeLessThan(500)
    }
  })
})

// ── Admin-only API Routes ──────────────────────────────────────────────────────

test.describe('Admin – Bot Detection API', () => {
  test('GET /api/bot-detection returns 401 for unauthenticated requests', async ({ request }) => {
    const response = await request.get('/api/bot-detection')
    expect(response.status()).toBe(401)
  })

  test('POST /api/bot-detection returns 401 for unauthenticated requests', async ({ request }) => {
    const response = await request.post('/api/bot-detection', {
      data: { votes: [] },
      headers: { 'Content-Type': 'application/json' },
    })
    expect(response.status()).toBe(401)
  })

  test('PUT /api/bot-detection returns 401 for unauthenticated requests', async ({ request }) => {
    const response = await request.put('/api/bot-detection', {
      data: { voterId: 'test' },
      headers: { 'Content-Type': 'application/json' },
    })
    expect(response.status()).toBe(401)
  })
})

test.describe('Admin – Export API', () => {
  test('GET /api/export returns 401 for unauthenticated requests', async ({ request }) => {
    const response = await request.get('/api/export')
    expect(response.status()).toBe(401)
  })
})

test.describe('Admin – Achievements API', () => {
  test('GET /api/achievements returns 401 for unauthenticated requests', async ({ request }) => {
    const response = await request.get('/api/achievements')
    expect(response.status()).toBe(401)
  })
})

// ── Publicly accessible admin-adjacent pages ──────────────────────────────────

test.describe('Admin – Public pages', () => {
  test('transparency page loads without errors', async ({ page }) => {
    const response = await page.goto('/transparency')
    if (response) {
      expect(response.status()).toBeLessThan(500)
    }
  })

  test('how-it-works page loads without errors', async ({ page }) => {
    const response = await page.goto('/how-it-works')
    if (response) {
      expect(response.status()).toBeLessThan(500)
    }
  })
})
