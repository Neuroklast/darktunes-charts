import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {},
}))

vi.mock('@/domain/categories', () => ({
  CATEGORY_DEFINITIONS: {
    track: { name: 'Best Track' },
    album: { name: 'Best Album' },
  },
}))

import { GET as getChartsRSS } from '../charts/route'
import { GET as getCompilationsRSS } from '../compilations/route'

describe('RSS Feed — /api/feed/charts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns a valid RSS 2.0 document with correct Content-Type', async () => {
    const response = await getChartsRSS()

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toMatch(/application\/rss\+xml/)
    const body = await response.text()
    expect(body).toContain('<?xml version="1.0"')
    expect(body).toContain('<rss version="2.0"')
    expect(body).toContain('<title>DarkTunes Charts</title>')
  })

  it('includes cache headers', async () => {
    const response = await getChartsRSS()
    const cacheControl = response.headers.get('Cache-Control')
    expect(cacheControl).toBeTruthy()
    expect(cacheControl).toContain('max-age=')
  })

  it('handles DB errors gracefully and still returns a feed', async () => {
    const response = await getChartsRSS()
    // Should succeed even with no DB entries
    expect(response.status).toBe(200)
  })
})

describe('RSS Feed — /api/feed/compilations', () => {
  it('returns a valid RSS 2.0 document', async () => {
    const response = await getCompilationsRSS()

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toMatch(/application\/rss\+xml/)
    const body = await response.text()
    expect(body).toContain('<title>DarkTunes Compilations</title>')
  })
})
