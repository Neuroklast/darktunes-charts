# Architecture Decision Records

## ADR-001: Quadratic Voting for Fan Pillar

**Status:** Accepted

**Context:** Traditional 1-person-1-vote systems allow wealthy fans or coordinated groups to dominate charts unfairly.

**Decision:** Implement quadratic voting where casting N votes costs N² voice credits. Each fan receives 100 credits per monthly period.

**Consequences:** Fans must distribute credits across multiple artists to maximise influence, reducing whale dominance and rewarding genuine breadth of fandom.

---

## ADR-002: Schulze Method for DJ Pillar

**Status:** Accepted

**Context:** Simple plurality voting (most first-place votes wins) is vulnerable to strategic ballot-stuffing and vote-splitting.

**Decision:** Implement the Schulze (Beatpath) Condorcet method for DJ ranked-choice ballots. DJs submit full preference orderings; the winner is the candidate that defeats all others via the strongest beatpath.

**Consequences:** Eliminates strategic burial (a flaw in Borda count systems used by awards like Eurovision). Computationally O(n³) but acceptable for ≤100 nominees per category.

---

## ADR-003: Five-Tier Band Classification

**Status:** Accepted

**Context:** Established acts with millions of listeners should not compete directly against bedroom producers with 500 followers.

**Decision:** Classify bands into five tiers based on Spotify monthly listeners:
- **Micro** (Underground): 0 – 10,000
- **Emerging** (Small): 10,001 – 50,000
- **Established** (Medium): 50,001 – 250,000
- **International** (Large): 250,001 – 1,000,000
- **Macro** (Crossover): above 1,000,000

**Consequences:** Fair competition within tiers. Cross-subsidization model: Macro bands pay higher category fees (€150/category) which fund free participation for Micro bands (€5/category, first category always free).

---

## ADR-004: Clique Detection via Network Graph Analysis

**Status:** Accepted

**Context:** Peer voting pillar is vulnerable to vote-trading rings where bands agree to mutually vote each other up.

**Decision:** Calculate a clique coefficient for each peer vote based on the density of mutual voting connections in the band graph. Votes from tight cliques are down-weighted using `calculateCliqueCoefficient()`.

**Consequences:** Legitimate peer appreciation (bands genuinely recommending others) receives full weight. Coordinated vote rings receive weights as low as 0.4, reducing their chart impact by 60%.

---

## ADR-005: localStorage-backed useKV Shim for Client-Side State

**Status:** Superseded by ADR-006 (backend-connected deployment). Retained for offline / demo mode.

**Context:** The platform previously depended on an external hosting platform's proprietary `useKV` hook for all persistent state. As part of the production-readiness migration to Vercel, all platform-specific dependencies have been fully removed.

**Decision:** Implement a drop-in `useKV(key, defaultValue)` shim in `src/lib/kv-shim.ts` backed by `localStorage`. The hook interface mirrors React's `useState` so all call sites required only a single import path change. KV keys are namespaced with a `kv:` prefix internally.

**Consequences:** State is per-device (localStorage). For multi-device sync and shared state, consumers must migrate to API-backed hooks (see ADR-006). The shim removes all proprietary platform dependencies, enabling pure Vercel deployment.

---

## ADR-006: Vercel Serverless Functions as Backend API

**Status:** Accepted

**Context:** The platform requires a production-grade, stateless backend deployable on Vercel without managing servers. All business logic (voting algorithms, tier calculation, bot detection) must be available via HTTP API.

**Decision:** Implement Vercel Serverless Functions in the `api/` directory using plain Node.js `IncomingMessage`/`ServerResponse` handlers (no Express dependency). Each handler is a single TypeScript file that Vercel compiles via its `nodejs22.x` runtime. A strict service-layer architecture separates concerns:

```
api/
├── _lib/               # Shared backend utilities (not exposed as routes)
│   ├── store.ts        # In-memory data store seeded with canonical band data
│   ├── data-processor.ts  # Chart computation, track filtering, normalisation
│   ├── csv-parser.ts   # Streaming CSV parser (readline, no full-file buffering)
│   ├── validators.ts   # Zod schemas + EAN-13/date/amount validators
│   ├── error-handler.ts   # sendJson / sendError / readBody helpers
│   └── cors.ts         # CORS header management
├── votes/
│   ├── fan.ts          # POST /api/votes/fan  – quadratic vote submission
│   ├── dj.ts           # POST /api/votes/dj   – DJ ballot + Schulze result
│   └── peer.ts         # POST /api/votes/peer – clique-weighted peer vote
├── bands.ts            # GET /api/bands, POST /api/bands
├── tracks.ts           # GET /api/tracks, POST /api/tracks
├── charts.ts           # GET /api/charts?limit=N
├── transparency.ts     # GET/POST /api/transparency
├── bot-detection.ts    # GET /api/bot-detection, PUT (review alert)
├── categories.ts       # GET /api/categories
├── ai-prediction.ts    # GET /api/ai-prediction?bandId=…
└── spotify.ts          # GET /api/spotify?bandId=… (mock Spotify listener data)
```

**Business Logic Reuse:** All voting algorithms (`calculateQuadraticCost`, `calculateSchulzeWinner`, `calculateCliqueCoefficient`, `generateAIPrediction`) are imported from `src/lib/` so the frontend and backend share a single source of truth.

**Data Persistence:** The in-memory store (`api/_lib/store.ts`) is seeded with the canonical 76-band dataset from `src/lib/seedData.ts`. Each warm Vercel instance retains state between requests; cold starts reinitialise from seed data. For multi-instance production use, replace the store module with a Vercel KV (Redis) adapter.

**Consequences:** Zero external database dependency for MVP. Complete REST API with JSON responses. Fan vote validation enforces the 100-credit budget server-side. Bot detection alerts integrate with the transparency log. All routes are CORS-enabled and return `Cache-Control: no-store` for API responses.

---

## ADR-007: Vercel Deployment Configuration

**Status:** Superseded by Next.js App Router migration (see below for current config)

> **Note:** The original ADR-007 described a Vite-SPA deployment (`buildCommand: tsc -b --noCheck && vite build`, `outputDirectory: dist`, SPA fallback rewrites). That configuration has been superseded by the migration to Next.js 15 App Router. The section below documents the current, active deployment setup.

**Context:** The project must deploy as a single Vercel project that serves both the Next.js App Router frontend and the serverless API route handlers defined under `src/app/api/`.

**Decision:** Configure `vercel.json` at the repository root with:
- `"framework": "nextjs"` — Vercel auto-detects Next.js and runs `next build`; output goes to `.next/`
- No custom `buildCommand` or `outputDirectory` — Next.js framework preset handles both
- Cron jobs declared under `"crons"`: `/api/cron/random-band` (daily), `/api/cron/schulze-compute` (hourly), `/api/cron/tier-refresh` (weekly)
- Security headers on all routes: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`; `Cache-Control: no-store` on all `/api/*` routes
- `vercel-deploy.sh` provides a one-step deploy script with pre-flight checks (node, npm, typecheck, tests, build)

**Consequences:** Single `vercel deploy` command deploys both frontend and backend via Next.js App Router API routes (`src/app/api/**`). No separate API server or SPA fallback rewrite is required — Next.js handles routing natively. Environment variables must be configured in the Vercel project settings (see `.env.example`).

---

## ADR-008: Clean Architecture Domain Layer (`src/domain/`)

**Status:** Accepted

**Context:** All business logic (voting algorithms, tier classification, audit trail, AI prediction) was co-located with infrastructure adapters in `src/lib/`. This violates the Single Responsibility Principle and makes it impossible to test domain logic in isolation from external concerns (React, network, localStorage).

**Decision:** Introduce a `src/domain/` layer following Clean Architecture / DDD principles:

```
src/domain/
├── voting/
│   ├── quadratic.ts   — Quadratic Voting cost function & budget validation
│   ├── schulze.ts     — Schulze Beatpath Condorcet method (Floyd-Warshall)
│   ├── peer.ts        — Anti-collusion clique coefficient (peer pillar)
│   ├── tiers.ts       — Submission cost logic (imports from domain/tiers)
│   ├── audit.ts       — Transparency log & bot detection
│   ├── prediction.ts  — AI breakthrough prediction algorithm
│   └── index.ts       — Barrel re-export
├── tiers/
│   └── index.ts       — Single Source of Truth: tier thresholds & pricing (ADR-010)
├── categories/
│   └── index.ts       — Canonical category definitions & eligibility logic (ADR-011)
├── events/
│   ├── eventBus.ts    — Typed EventBus/Mediator for domain events (ADR-012)
│   ├── ranking.ts     — Event ranking by attendee intent count
│   └── index.ts       — Barrel re-export
├── repositories/
│   └── index.ts       — Repository interfaces (IUser, IBand, IAchievement) (ADR-013)
├── payment/
│   └── tierPricing.ts — Stripe-oriented pricing (imports from domain/tiers)
└── ...
```

A companion `src/infrastructure/` layer wraps external adapters:

```
src/infrastructure/
├── api/           — iTunes, Odesli, Spotify adapters
├── payment/       — Stripe adapter
├── repositories/  — In-memory (test) repository implementations (ADR-013)
└── pipeline/      — Track enrichment pipeline
```

The existing `src/lib/` files become thin shims that re-export from the domain layer, preserving backward compatibility for all existing tests and consumers.

**Consequences:** Domain functions are pure TypeScript — they can be tested without DOM, React, or network stubs. Future migration to a different runtime (Next.js, Deno, Bun) requires only infrastructure adapter changes. The `src/lib/` shim pattern prevents a big-bang migration while establishing the target architecture.

---

## ADR-010: Consolidate Tier Logic into Single Source of Truth

**Status:** Accepted

**Context:** Tier thresholds and pricing were duplicated between `domain/voting/tiers.ts` (`TIER_THRESHOLDS`, `TIER_PRICING`) and `domain/payment/tierPricing.ts` (`TIER_MONTHLY_PRICE_EUR`). Both files defined identical values independently, creating a maintenance risk: a pricing change in one file could easily be missed in the other.

**Decision:** Create `src/domain/tiers/index.ts` as the single canonical source for `TIER_THRESHOLDS`, `TIER_PRICING_EUR`, `getTierFromListeners()`, and `getTierPriceEur()`. Both `voting/tiers.ts` and `payment/tierPricing.ts` now import from this shared module instead of defining their own constants.

**Consequences:** Any future tier threshold or pricing change needs to be made in exactly one file. Existing consumers are unaffected because the public APIs of `voting/tiers` and `payment/tierPricing` remain identical (re-exports preserve the same function signatures).

---

## ADR-011: Fix Categories Dependency Inversion

**Status:** Accepted

**Context:** `src/domain/categories/index.ts` was a re-export facade that imported from `src/lib/categories.ts`. This inverted the dependency direction: the domain layer depended on the library layer, violating Clean Architecture's dependency rule.

**Decision:** Move all category definitions, metadata constants, and pure functions into `src/domain/categories/index.ts` (the canonical source). Convert `src/lib/categories.ts` into a backward-compatibility shim that re-exports from `@/domain/categories`, following the same pattern already established by `src/lib/voting.ts`.

**Consequences:** The dependency direction is now correct: `lib` → `domain` (outward → inward). All existing imports from `@/lib/categories` continue to work through the shim. New code should import from `@/domain/categories`.

---

## ADR-012: Domain Event System (EventBus/Mediator)

**Status:** Accepted

**Context:** Cross-cutting domain communication (e.g., notifying the achievement system when a vote is cast, or logging tier changes in the transparency trail) required direct module-to-module imports, creating tight coupling between unrelated domain modules.

**Decision:** Implement a typed, synchronous EventBus in `src/domain/events/eventBus.ts`. Domain events are TypeScript discriminated unions keyed by `type`: `VoteSubmitted`, `TierChanged`, `BotDetected`, `AchievementEarned`. Handlers subscribe by event type and are invoked in registration order. The bus is intentionally synchronous; async side-effects should enqueue work rather than await inline.

**Consequences:** Domain modules can emit events without knowing who listens. New cross-cutting concerns (e.g., analytics, notifications) can be added by subscribing to existing events without modifying emitting modules. The typed event map provides compile-time safety for event payloads.

---

## ADR-013: Repository Abstraction Layer

**Status:** Accepted

**Context:** API routes in `src/app/api/` access Prisma directly, mixing HTTP concerns with database queries. This makes routes hard to unit test (they require a real or mocked database) and tightly couples the application to Prisma's API surface.

**Decision:** Define repository interfaces in `src/domain/repositories/` (`IUserRepository`, `IBandRepository`, `IAchievementRepository`) and implement them in `src/infrastructure/repositories/`. In-memory implementations are provided for unit testing. API routes will progressively migrate to depend on these interfaces via dependency injection rather than importing Prisma directly.

**Consequences:** Domain logic and API routes can be tested with fast, in-memory repositories. Persistence technology (Prisma, Drizzle, raw SQL) can be swapped without changing business logic. The migration is incremental — existing routes continue to work while new routes adopt the repository pattern.

---

## ADR-009: `prefers-reduced-motion` CSS Support (WCAG 2.1 / DIN EN ISO 9241-110)

**Status:** Accepted

**Context:** The platform defines rich CSS micro-interactions (modal-in, fade-up, slide-in-right, glow-pulse). Users with vestibular disorders or motion sensitivity can set `prefers-reduced-motion: reduce` in their OS settings. Without an explicit media query override, these animations play regardless, violating WCAG 2.1 Success Criterion 2.3.3 (Animation from Interactions) and DIN EN ISO 9241-110 Fehlertoleranz (error tolerance) requirements.

**Decision:** Add a `@media (prefers-reduced-motion: reduce)` block to `src/index.css` that collapses all animation/transition durations to 0.01ms and explicitly resets all named animation utility classes. Opacity transitions are preserved since they convey state (loading, modal open) without vestibular risk.

**Consequences:** WCAG 2.1 SC 2.3.3 compliance. DIN EN ISO 9241-110 Fehlertoleranz satisfied. No JavaScript required — the CSS media query is handled natively by the browser. Framer Motion's `useReducedMotion` hook should be used for JavaScript-driven animations in future components.
