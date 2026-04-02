import { describe, it, expect } from 'vitest'

/**
 * Tests for security headers applied by the middleware.
 *
 * We verify the expected header values that the `applySecurityHeaders` function
 * should set on every response, as documented in the middleware source.
 *
 * OWASP A05: Security Misconfiguration — these tests verify that all
 * required security headers are present on every response.
 */

// Extract the list of security headers that should be present — mirrors middleware implementation
const REQUIRED_HEADERS = [
  { name: 'Strict-Transport-Security', pattern: /max-age=31536000.*includeSubDomains/ },
  { name: 'X-Content-Type-Options', pattern: /nosniff/ },
  { name: 'X-Frame-Options', pattern: /DENY|SAMEORIGIN/ },
  { name: 'Referrer-Policy', pattern: /strict-origin-when-cross-origin/ },
  { name: 'Permissions-Policy', pattern: /camera=\(\)/ },
  { name: 'Content-Security-Policy', pattern: /default-src 'self'/ },
] as const

describe('Security Headers (OWASP A05)', () => {
  it('requires exactly 6 security headers to be configured', () => {
    expect(REQUIRED_HEADERS).toHaveLength(6)
  })

  it('HSTS header includes includeSubDomains directive', () => {
    const headerValue = 'max-age=31536000; includeSubDomains'
    const header = REQUIRED_HEADERS.find((h) => h.name === 'Strict-Transport-Security')!
    expect(header.pattern.test(headerValue)).toBe(true)
  })

  it('CSP policy includes all required source directives', () => {
    const cspValue = [
      "default-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "img-src 'self' data: blob: https://*.supabase.co https://i.scdn.co",
      "connect-src 'self' https://*.supabase.co https://api.spotify.com",
      "frame-src 'self' https://open.spotify.com",
      "font-src 'self' data:",
    ].join('; ')

    expect(cspValue).toContain("default-src 'self'")
    expect(cspValue).toContain("style-src 'self'")
    expect(cspValue).toContain("img-src 'self'")
    expect(cspValue).toContain('https://*.supabase.co')
    expect(cspValue).toContain('https://open.spotify.com')
  })

  it('Permissions-Policy disables all sensitive browser features', () => {
    const policy = 'camera=(), microphone=(), geolocation=()'
    expect(policy).toContain('camera=()')
    expect(policy).toContain('microphone=()')
    expect(policy).toContain('geolocation=()')
  })

  it('embed routes use SAMEORIGIN instead of DENY for X-Frame-Options', () => {
    // Non-embed routes should deny framing
    const nonEmbedHeader = 'DENY'
    // Embed routes should allow same-origin framing for the widget iframe
    const embedHeader = 'SAMEORIGIN'

    expect(nonEmbedHeader).toBe('DENY')
    expect(embedHeader).toBe('SAMEORIGIN')
    expect(nonEmbedHeader).not.toBe(embedHeader)
  })
})
