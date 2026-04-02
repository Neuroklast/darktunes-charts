# Architecture Decision Records — DarkTunes

> This file documents all significant architectural decisions made during development.
> Format: Status, Context, Decision, Consequences.

---

## ADR-018: Resend for Transactional Email

**Status:** Accepted

**Context:** The platform needs transactional email delivery for welcome emails, chart publications, DJ application status updates, and weekly digests. Options considered: SendGrid, Mailgun, AWS SES, Resend.

**Decision:** Use Resend (resend.com) for transactional email.

**Reasons:**
- Developer-first API with simple REST interface
- European data residency options (GDPR-compliant)
- Generous free tier (3,000 emails/month)
- No SDK required — plain fetch() calls keep the bundle size small

**Consequences:** API key stored in `RESEND_API_KEY` env var. Falls back to console.log in dev when key is absent. Templates are plain HTML strings — no templating engine dependency.

---

## ADR-019: Upstash Redis for Distributed Rate Limiting

**Status:** Proposed (in-memory rate limiter retained for now)

**Context:** The current in-memory rate limiter works on single-instance deployments but fails on multi-region Vercel deployments where each edge instance has its own memory. For production scale, a Redis-backed rate limiter is needed.

**Decision:** Add `@upstash/ratelimit` + `@upstash/redis` as a future upgrade path. The current in-memory implementation (`src/infrastructure/rateLimiter.ts`) is retained for single-instance deployments. Env vars `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are documented in `.env.example` for when this migration is needed.

**Consequences:** No immediate change to rate limiting behaviour. Migration to Upstash requires swapping the `rateLimiter.check()` calls with `@upstash/ratelimit` Ratelimit instance.

---

## ADR-020: Sentry for Error Monitoring

**Status:** Proposed (configuration prepared)

**Context:** Production deployments need error monitoring to detect API failures, unhandled exceptions, and performance issues. Sentry is the industry standard for Next.js applications.

**Decision:** Document Sentry DSN env vars in `.env.example`. Full Sentry SDK integration (`@sentry/nextjs`) requires additional configuration files (`sentry.client.config.ts`, etc.) and is deferred to avoid increasing bundle size without a paid DSN configured.

**Consequences:** `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` env vars are ready for use. Manual `try/catch` blocks in all API routes ensure errors are always handled gracefully regardless of Sentry configuration.

---

## ADR-021: GDPR Compliance — Anonymisation over Deletion

**Status:** Accepted

**Context:** GDPR Art. 17 (Right to Erasure) requires that personal data be deleted upon request. However, deleting fan votes entirely would corrupt chart integrity — past chart results would change retroactively.

**Decision:** On account deletion (`DELETE /api/auth/me`):
- Fan votes are **anonymised** (userId set to NULL) rather than deleted. The vote weight is preserved but can no longer be linked to an individual.
- DJ ballots are **deleted** entirely (they contain ranked-choice data that would identify the individual).
- Personal profile data is **deleted** from both the application DB and Supabase Auth.

This approach is consistent with GDPR Recital 26: anonymised data is no longer "personal data" and is exempt from GDPR requirements.

**Consequences:** Charts computed before account deletion remain valid. The data export endpoint (`GET /api/auth/me/data-export`) implements GDPR Art. 20 (data portability) by returning all personal data as downloadable JSON.

---

## ADR-022: Embed Widget Architecture — iframe over Web Component

**Status:** Accepted

**Context:** Third-party sites (music blogs, festivals) want to embed DarkTunes charts. Options: iframe embed, Web Component, JS snippet.

**Decision:** Use Next.js pages at `/embed/charts` and `/embed/band/[slug]` as iframe targets. Configure via query parameters (`?category`, `?limit`, `?theme`).

**Reasons:**
- **Security isolation:** iframes provide full security sandbox — no XSS risk from embedding site
- **Zero client dependencies:** No JavaScript required on the embedding site
- **Simplicity:** Next.js already supports page rendering; no new runtime needed
- **CSP-compatible:** The embedding site's CSP only needs to allow frames from darktunes.com

**Consequences:** Embed pages use `<html>` root with inline styles (no Tailwind) to minimise render weight. CORS headers allow cross-origin embedding. robots.txt disallows crawling of `/embed/` pages.

---

## ADR-023: Discord Webhook for Community Notifications

**Status:** Accepted

**Context:** The DarkTunes community uses Discord for communication. Automated chart publication announcements increase engagement.

**Decision:** Implement a lightweight Discord webhook client in `src/infrastructure/discord/webhook.ts` using plain `fetch()`. No Discord SDK dependency.

**Consequences:** Requires `DISCORD_WEBHOOK_URL` env var. When not set, all webhook calls silently succeed (no-op) — the application runs without Discord integration. Admins can test the integration via `POST /api/admin/discord/test-webhook`.

---

## ADR-024: Security Headers via Next.js Middleware

**Status:** Accepted

**Context:** Production deployments require HTTP security headers to prevent common web attacks. Options: Vercel response headers in `vercel.json`, Next.js middleware, or `next.config.ts` headers config.

**Decision:** Apply security headers in `src/middleware.ts` via an `applySecurityHeaders()` helper function. This ensures headers are applied to ALL responses including redirects and API responses.

**Headers applied:**
- `Strict-Transport-Security: max-age=31536000; includeSubDomains` (HSTS)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY` (embed pages set their own header)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Content-Security-Policy` (allowlist-based, includes Supabase and Spotify CDN)

**Consequences:** All responses get security headers. Embed pages (`/embed/`) would be blocked by `X-Frame-Options: DENY` but they are server-rendered HTML documents with no middleware path (API routes are excluded from the middleware matcher).
