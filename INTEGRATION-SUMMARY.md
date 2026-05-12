# INTEGRATION-SUMMARY.md — darkTunes Charts

> Living document tracking implementation status. Update after every session.
> Last updated: 2026-05-12

---

## Implemented

### Infrastructure & Deployment

| Feature | File(s) | Notes |
|---|---|---|
| Next.js 15 App Router | `src/app/` | SSR + Server Components |
| Middleware (auth + i18n + security) | `middleware.ts` (root) | next-intl + Supabase session + security headers |
| Supabase SSR session refresh | `src/lib/supabase/middleware.ts` | Cookie-based session persistence |
| Supabase Server client | `src/lib/supabase/server.ts` | Cookie-based, for Server Components |
| Supabase Browser client | `src/lib/supabase/client.ts` | Singleton for Client Components |
| Vercel deployment config | `vercel.json` | Framework, build command, crons, security headers, static caching |
| Vercel install script | `scripts/vercel-install.sh` | `npm ci` + required env var validation |
| Next.js performance config | `next.config.ts` | `compress: true`, `poweredByHeader: false`, CORS headers |
| Security header overrides (package) | `package.json` (overrides) | `picomatch`, `path-to-regexp`, `lodash` pinned |

### Domain Logic

| Feature | File(s) | ADR | Notes |
|---|---|---|---|
| Quadratic Voting (Fan) | `src/domain/voting/` | ADR-001 | 100 credits/month per user |
| Schulze Condorcet (DJ) | `src/domain/voting/schulze.ts` | ADR-002 | Beatpath method |
| Tier system | `src/domain/voting/` | ADR-003, ADR-010 | 4 tiers, weekly refresh |
| Voting audit trail | `src/domain/voting/` | ADR-004 | Full transparency log |
| AI breakthrough prediction | `src/domain/voting/` | ADR-005 | Predictive scoring |
| Anti-fraud / bot detection | `src/domain/voting/` | ADR-006 | Rate limiting + anomaly detection |
| Genre taxonomy | `src/domain/categories/` | ADR-015 | 8 top-level genres |
| Domain EventBus | `src/domain/events/eventBus.ts` | — | Publish/subscribe for domain events |
| Repository interfaces | `src/domain/repositories/` | — | IBandRepository, etc. |

### API Routes

| Endpoint | File | Notes |
|---|---|---|
| `GET/POST /api/bands` | `src/app/api/bands/` | Band management |
| `GET/POST /api/tracks` | `src/app/api/tracks/` | Track submission |
| `GET /api/charts` | `src/app/api/charts/` | Chart rankings |
| `GET /api/categories` | `src/app/api/categories/` | Genre categories |
| `GET/POST /api/votes/fan` | `src/app/api/votes/fan/` | QV fan votes |
| `GET/POST /api/votes/dj` | `src/app/api/votes/` | Schulze DJ ballots |
| `GET/POST /api/transparency` | `src/app/api/transparency/` | Audit log |
| `GET /api/ai-prediction` | `src/app/api/ai-prediction/` | AI scoring |
| `GET /api/spotify` | `src/app/api/spotify/` | Spotify data |
| `GET /api/health` | `src/app/api/health/route.ts` | DB status + uptime |
| `GET /api/auth/[...supabase]` | `src/app/api/auth/` | Supabase OAuth callback |
| `POST /api/cron/random-band` | `src/app/api/cron/random-band/` | Daily random band (0 0 * * *) |
| `POST /api/cron/schulze-compute` | `src/app/api/cron/schulze-compute/` | Hourly Schulze compute (0 * * * *) |
| `POST /api/cron/tier-refresh` | `src/app/api/cron/tier-refresh/` | Weekly tier refresh (0 3 * * 0) |

### Architecture Utilities

| Utility | File | Notes |
|---|---|---|
| Centralised error handling | `src/lib/errors.ts` | `ApiError` + `withErrorHandler` HOC |
| Image optimisation proxy | `src/lib/imageUtils.ts` | wsrv.nl, WebP, resize |
| Shared prop interfaces | `src/lib/component-contracts.ts` | `SectionProps`, `DialogProps`, `AdminPanelProps<T>` |
| Type-safe env validation | `src/env.ts` | Validates env vars at startup |
| Rate limiter | `src/infrastructure/rateLimiter.ts` | In-memory, per-route |
| Web Workers | `src/workers/` | Offloads compute-heavy tasks from main thread |

### Error Handling (UI)

| Component | File | Notes |
|---|---|---|
| Route-segment error boundary | `src/app/error.tsx` | Catches errors in route segments |
| Global error boundary | `src/app/global-error.tsx` | Catches errors in root layout |
| React error boundary | `src/ErrorFallback.tsx` | Legacy client-side fallback |

### Auth & User Management

| Feature | File(s) | Notes |
|---|---|---|
| Supabase auth (email + OAuth) | `src/app/[locale]/login/` | Sign in / sign up |
| Auth guards (middleware) | `middleware.ts` | Redirects unauthenticated users |
| User profile | `src/app/[locale]/(protected)/profile/` | Edit profile |
| Onboarding | `src/app/[locale]/onboarding/` | Post-signup flow |

### i18n

| Feature | File(s) | Notes |
|---|---|---|
| next-intl | `src/i18n/request.ts` | German (default) + English |
| Translation files | `messages/de.json`, `messages/en.json` | |
| URL strategy | `middleware.ts` | `localePrefix: 'as-needed'` |

### Documentation

| Document | Status | Notes |
|---|---|---|
| `AGENTS.md` | ✅ Complete | AI agent spec, coding conventions, architecture rules |
| `README.md` | ✅ Updated | Two-pillar system, Next.js, correct port (3000) |
| `DEPLOYMENT.md` | ✅ Complete | Vercel + Supabase + env vars + post-deploy checklist |
| `ARCHITECTURE.md` | ✅ Complete | ADR-001 through ADR-018 |
| `CHANGELOG.md` | ✅ Maintained | |
| `INTEGRATION-SUMMARY.md` | ✅ This file | |
| `SECURITY.md` | ✅ Complete | |
| `.env.example` | ✅ Complete | All variables documented |

---

## Pending / In Progress

| Feature | Priority | Notes |
|---|---|---|
| Cloudflare R2 CDN integration | Medium | Cache artist/album art in R2 for faster delivery; needs `@aws-sdk/client-s3` |
| `unstable_cache` in Server Components | Medium | Add ISR caching with `revalidate: 60` and `tags` to public page queries |
| Server Actions for form submissions | Low | Replace client-side `fetch('/api/...')` calls with React 19 Server Actions |
| Lenis smooth scrolling | Low | Install `lenis`, create `LenisProvider` in `app/_components/Providers.tsx` |
| `withErrorHandler` adoption | Medium | Wrap all existing API route handlers with `withErrorHandler` from `src/lib/errors.ts` |
| Image migration to wsrv.nl | Medium | Update all `<Image>` components to use `getOptimizedImageUrl()` / `getSquareThumbnail()` |
| Supabase Edge Functions | Low | Email transactional flows (Resend DOI, ADR-018) |
| Rate limiter upgrade to Upstash | Low | Replace in-memory rate limiter with Upstash Redis for multi-region deployments |
| Admin panel documentation | Low | Create `ADMIN.md` for admin panel usage |

---

## Key File Reference

| File | Purpose |
|---|---|
| `middleware.ts` | Root Next.js middleware — i18n + auth + security headers |
| `src/lib/supabase/middleware.ts` | Supabase session refresh helper |
| `src/lib/supabase/server.ts` | Supabase server client (Server Components) |
| `src/lib/supabase/client.ts` | Supabase browser client (Client Components) |
| `src/lib/errors.ts` | `ApiError` class + `withErrorHandler` HOC |
| `src/lib/imageUtils.ts` | `getOptimizedImageUrl` + `getSquareThumbnail` (wsrv.nl) |
| `src/lib/component-contracts.ts` | `SectionProps`, `DialogProps`, `AdminPanelProps<T>` |
| `src/env.ts` | Type-safe environment variable validation |
| `src/app/error.tsx` | Next.js route-segment error boundary |
| `src/app/global-error.tsx` | Next.js global error boundary |
| `src/app/api/health/route.ts` | Health check endpoint (DB + uptime) |
| `src/domain/voting/` | QV, Schulze, Tier system, audit trail |
| `src/domain/repositories/` | Repository interface contracts |
| `src/infrastructure/repositories/` | Prisma repository implementations |
| `src/workers/` | Web Workers for compute-intensive tasks |
| `prisma/schema.prisma` | Database schema (source of truth) |
| `vercel.json` | Vercel config (framework, crons, headers, install command) |
| `scripts/vercel-install.sh` | CI install + env var validation script |
| `next.config.ts` | Next.js config (compression, headers, image domains) |
| `.env.example` | Full environment variable reference |
| `messages/de.json` | German translations |
| `messages/en.json` | English translations |
