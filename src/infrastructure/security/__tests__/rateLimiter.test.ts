import { describe, it, expect, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import {
  checkRateLimit,
  createRateLimiter,
  withRateLimit,
  getRateLimitKey,
  _resetRateLimitStore,
} from '../rateLimiter'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createMockRequest(
  url = 'http://localhost:3000/api/test',
  ip = '192.168.1.1',
): NextRequest {
  return new NextRequest(url, {
    headers: { 'x-forwarded-for': ip },
  })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('rate limiter', () => {
  beforeEach(() => {
    _resetRateLimitStore()
  })

  describe('checkRateLimit', () => {
    it('allows requests within the limit', () => {
      const config = { windowMs: 60_000, maxRequests: 5 }

      const result = checkRateLimit('test-key', config)

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(4) // 5 max - 1 used = 4 remaining
    })

    it('blocks requests that exceed the limit', () => {
      const config = { windowMs: 60_000, maxRequests: 3 }

      // Use up all 3 requests
      checkRateLimit('test-key', config)
      checkRateLimit('test-key', config)
      checkRateLimit('test-key', config)

      const result = checkRateLimit('test-key', config)

      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
      expect(result.resetMs).toBeGreaterThan(0)
    })

    it('tracks different keys independently', () => {
      const config = { windowMs: 60_000, maxRequests: 2 }

      checkRateLimit('user-1', config)
      checkRateLimit('user-1', config)
      const user1Result = checkRateLimit('user-1', config)

      const user2Result = checkRateLimit('user-2', config)

      expect(user1Result.allowed).toBe(false)
      expect(user2Result.allowed).toBe(true)
    })

    it('returns correct remaining count', () => {
      const config = { windowMs: 60_000, maxRequests: 5 }

      const r1 = checkRateLimit('key', config)
      expect(r1.remaining).toBe(4)

      const r2 = checkRateLimit('key', config)
      expect(r2.remaining).toBe(3)

      const r3 = checkRateLimit('key', config)
      expect(r3.remaining).toBe(2)
    })
  })

  describe('createRateLimiter', () => {
    it('creates a limiter with the given configuration', () => {
      const limiter = createRateLimiter({ windowMs: 30_000, maxRequests: 10 })

      expect(limiter.config.windowMs).toBe(30_000)
      expect(limiter.config.maxRequests).toBe(10)
    })

    it('check function works correctly', () => {
      const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 2 })

      const r1 = limiter.check('key')
      expect(r1.allowed).toBe(true)

      limiter.check('key')
      const r3 = limiter.check('key')
      expect(r3.allowed).toBe(false)
    })
  })

  describe('getRateLimitKey', () => {
    it('returns user-based key when userId is provided', () => {
      const request = createMockRequest()
      const key = getRateLimitKey(request, 'user-123')

      expect(key).toBe('user:user-123')
    })

    it('returns IP-based key when no userId is provided', () => {
      const request = createMockRequest('http://localhost:3000/api/test', '10.0.0.1')
      const key = getRateLimitKey(request)

      expect(key).toBe('ip:10.0.0.1')
    })

    it('extracts first IP from x-forwarded-for with multiple IPs', () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '10.0.0.1, 10.0.0.2, 10.0.0.3' },
      })
      const key = getRateLimitKey(request)

      expect(key).toBe('ip:10.0.0.1')
    })

    it('returns "ip:unknown" when no IP is available', () => {
      const request = new NextRequest('http://localhost:3000/api/test')
      const key = getRateLimitKey(request)

      expect(key).toBe('ip:unknown')
    })
  })

  describe('withRateLimit', () => {
    it('allows requests within the limit and adds rate limit headers', async () => {
      const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 10 })
      const handler = withRateLimit(
        limiter,
        async () => NextResponse.json({ ok: true }),
        () => 'test-key',
      )

      const response = await handler(createMockRequest())
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.ok).toBe(true)
      expect(response.headers.get('X-RateLimit-Limit')).toBe('10')
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('9')
    })

    it('returns 429 when rate limit is exceeded', async () => {
      const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 1 })
      const handler = withRateLimit(
        limiter,
        async () => NextResponse.json({ ok: true }),
        () => 'test-key',
      )

      // First request should succeed
      const r1 = await handler(createMockRequest())
      expect(r1.status).toBe(200)

      // Second request should be rate limited
      const r2 = await handler(createMockRequest())
      const body = await r2.json()

      expect(r2.status).toBe(429)
      expect(body.error).toContain('Too many requests')
      expect(r2.headers.get('Retry-After')).toBeTruthy()
      expect(r2.headers.get('X-RateLimit-Remaining')).toBe('0')
    })

    it('uses IP-based key when no custom key function is provided', async () => {
      const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 1 })
      const handler = withRateLimit(
        limiter,
        async () => NextResponse.json({ ok: true }),
      )

      const r1 = await handler(createMockRequest('http://localhost:3000/api/test', '10.0.0.1'))
      expect(r1.status).toBe(200)

      // Different IP should not be rate limited
      const r2 = await handler(createMockRequest('http://localhost:3000/api/test', '10.0.0.2'))
      expect(r2.status).toBe(200)

      // Same IP should be rate limited
      const r3 = await handler(createMockRequest('http://localhost:3000/api/test', '10.0.0.1'))
      expect(r3.status).toBe(429)
    })
  })
})
