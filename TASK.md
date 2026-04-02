# DarkTunes — Task Tracker

## Phase Status Overview

| Phase | PR | Status | Description |
|---|---|---|---|
| Phase 1 | #179 | ✅ Merged | Peer-Voting eliminieren, 2-Säulen-Modell, Genre-Taxonomie, DJ-Verifizierung, CI/CD |
| Phase 2 | #180 | ✅ Merged | Supabase DB, Auth + Stripe, Voting API, Chart Computation Engine |
| Phase 3 | #181 | ✅ Merged | Compilation Engine, Band Analytics, Community Awards, Spotify Integration, Public API v1 |
| Phase 4 | Current PR | ✅ Complete | Production-Ready & Community Growth |

---

## Phase 4: Production-Ready & Community Growth

### Block A: Frontend Pages ✅
- [x] `/compilations` — Compilation browser with tracklist and Spotify embed
- [x] `/bands/[slug]` — Band profile (slug-based, with releases, streaming links, JSON-LD)
- [x] `/bands/[slug]/analytics` — Analytics dashboard gated by subscription tier (Free/Pro/Pro+)
- [x] `/awards` — Public community awards page (nominating/voting/closed states)
- [x] `/privacy` — DSGVO/GDPR-required privacy policy page
- [x] `/imprint` — German §5 TMG required imprint page
- [x] `/embed/charts` — Embeddable chart widget (iframe-friendly, query-param configurable)
- [x] `/embed/band/[slug]` — Embeddable band card

Pre-existing pages (already built in earlier phases, kept and improved):
- `/vote/fan`, `/vote/dj`, `/charts`, `/admin`, `/dashboard/band`, `/dashboard/dj`

### Block B: Real-World Integration ✅
- [x] `src/infrastructure/spotify/playlistSync.ts` — Spotify playlist sync (Auth Code Flow)
- [x] `POST /api/admin/compilations/:id/sync-spotify` — Trigger compilation→Spotify sync
- [x] `src/app/sitemap.ts` — Dynamic sitemap (bands, charts, compilations)
- [x] `src/app/robots.ts` — robots.txt configuration
- [x] `src/app/api/feed/charts/route.ts` — RSS 2.0 feed for chart updates
- [x] `src/app/api/feed/compilations/route.ts` — RSS 2.0 feed for compilations
- [x] `src/infrastructure/email/service.ts` — Email service (Resend) with 4 templates
- [x] `src/app/api/cron/weekly-digest/route.ts` — Weekly chart digest email cron

### Block C: Production Hardening ✅
- [x] Security headers in `src/middleware.ts` (HSTS, X-Frame-Options, CSP, etc.)
- [x] `src/app/api/health/route.ts` — Health check endpoint with DB connectivity check
- [x] `DELETE /api/auth/me` — GDPR Art. 17 account deletion (anonymises votes)
- [x] `GET /api/auth/me/data-export` — GDPR Art. 20 data portability export
- [x] `.env.example` updated: RESEND_API_KEY, DISCORD_WEBHOOK_URL, UPSTASH_REDIS_*, SENTRY_DSN, NEXT_PUBLIC_SITE_URL

### Block D: Embed Widget & Community Tools ✅
- [x] `/embed/charts` — Configurable embed widget (?category, ?limit, ?theme)
- [x] `/embed/band/[slug]` — Embeddable band card
- [x] `src/infrastructure/discord/webhook.ts` — Discord webhook with chart announcement helper
- [x] `POST /api/admin/discord/test-webhook` — Test Discord webhook (admin only)

### Tests ✅
- [x] `src/app/api/health/__tests__/route.test.ts` — Health check tests (3 tests)
- [x] `src/app/api/feed/__tests__/route.test.ts` — RSS feed tests (4 tests)
- [x] `src/app/api/auth/me/__tests__/route.test.ts` — GDPR deletion tests (2 tests)
- [x] `src/infrastructure/discord/__tests__/webhook.test.ts` — Discord webhook tests (4 tests)
- [x] `src/infrastructure/spotify/__tests__/playlistSync.test.ts` — Spotify sync tests (7 tests)
- [x] `src/__tests__/securityHeaders.test.ts` — Security header tests (4 tests)

**Total after Phase 4: 771 tests in 54 files (all passing)**

### Memory Bank Updates ✅
- [x] TASK.md (this file)
- [x] DECISIONS.md
- [x] LESSONS_LEARNED.md
- [x] ARCHITECTURE.md
