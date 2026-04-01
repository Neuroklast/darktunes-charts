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

**Status:** Superseded by ADR-014

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
│   ├── tiers.ts       — Five-tier classification & progressive pricing
│   ├── audit.ts       — Transparency log & bot detection
│   ├── prediction.ts  — AI breakthrough prediction algorithm
│   └── index.ts       — Barrel re-export
└── categories/
    └── index.ts       — Category definitions, eligibility logic, weight calculation
```

A companion `src/infrastructure/api/` layer wraps the iTunes and Odesli HTTP clients, isolating network I/O from domain logic. The existing `src/lib/` files become thin shims that re-export from the domain layer, preserving backward compatibility for all existing tests and consumers.

**Consequences:** Domain functions are pure TypeScript — they can be tested without DOM, React, or network stubs. Future migration to a different runtime (Next.js, Deno, Bun) requires only infrastructure adapter changes. The `src/lib/` shim pattern prevents a big-bang migration while establishing the target architecture.

---

## ADR-009: `prefers-reduced-motion` CSS Support (WCAG 2.1 / DIN EN ISO 9241-110)

**Status:** Accepted

**Context:** The platform defines rich CSS micro-interactions (modal-in, fade-up, slide-in-right, glow-pulse). Users with vestibular disorders or motion sensitivity can set `prefers-reduced-motion: reduce` in their OS settings. Without an explicit media query override, these animations play regardless, violating WCAG 2.1 Success Criterion 2.3.3 (Animation from Interactions) and DIN EN ISO 9241-110 Fehlertoleranz (error tolerance) requirements.

**Decision:** Add a `@media (prefers-reduced-motion: reduce)` block to `src/index.css` that collapses all animation/transition durations to 0.01ms and explicitly resets all named animation utility classes. Opacity transitions are preserved since they convey state (loading, modal open) without vestibular risk.

**Consequences:** WCAG 2.1 SC 2.3.3 compliance. DIN EN ISO 9241-110 Fehlertoleranz satisfied. No JavaScript required — the CSS media query is handled natively by the browser. Framer Motion's `useReducedMotion` hook should be used for JavaScript-driven animations in future components.

---

## ADR-010: Consolidated Tier Logic — Single Source of Truth

**Status:** Accepted

**Context:** The five-tier band classification constants (`TIER_THRESHOLDS`, `TIER_PRICING`) and the `getTierFromListeners()` function were duplicated across `src/domain/voting/tiers.ts` and `src/domain/payment/tierPricing.ts`. This violated the DRY principle and created a maintenance risk where tier updates in one module could be missed in the other.

**Decision:** Introduce `src/domain/tiers/index.ts` as the single canonical source for tier thresholds (`TIER_THRESHOLDS`), tier pricing (`TIER_PRICING_EUR`), and the `getTierFromListeners()` classifier. Both `voting/tiers.ts` and `payment/tierPricing.ts` import from this shared module and re-export for backward compatibility.

**Consequences:** One place to update tier boundaries or pricing. Downstream modules remain decoupled — voting code has no dependency on payment code and vice versa. The `src/lib/voting.ts` shim continues to re-export `getTierFromListeners` unchanged.

---

## ADR-011: Domain Event System (EventBus / Mediator)

**Status:** Accepted

**Context:** Cross-cutting domain communication (e.g., vote submission → transparency log, tier change → notification) was handled synchronously in API routes, tightly coupling unrelated domains. There was no mechanism for modules to react to domain-significant occurrences without direct imports.

**Decision:** Introduce a lightweight, typed EventBus in `src/domain/events/eventBus.ts` following the Mediator pattern. Events are TypeScript discriminated unions keyed on a `type` field. Four initial events: `VoteSubmitted`, `TierChanged`, `BotDetected`, `AchievementEarned`. The `IEventBus` interface enables test substitution.

**Consequences:** Domains communicate via events rather than direct function calls. Adding a new cross-cutting concern (e.g., analytics, email notifications) requires only subscribing a handler — no changes to the publishing domain. Events are synchronous and in-memory; durable event sourcing can be layered via an infrastructure adapter.

---

## ADR-012: Repository Abstraction Layer

**Status:** Accepted

**Context:** API routes accessed Prisma directly (`prisma.user.findUnique(...)`, `prisma.band.upsert(...)`), violating the Dependency Inversion Principle. This made it impossible to swap the database without modifying all API routes and prevented unit testing without mocking the entire Prisma client.

**Decision:** Define repository interfaces in `src/domain/repositories/` (`IUserRepository`, `IBandRepository`, `IAchievementRepository`) and implement them in `src/infrastructure/repositories/` with both Prisma-backed and in-memory variants. API routes receive their repository through module-level default instances (simple dependency injection), which can be overridden via factory functions in tests.

**Consequences:** API routes depend on abstractions, not on Prisma. In-memory implementations enable fast, isolated unit tests. Database migration (e.g., to Drizzle ORM) only requires new repository implementations — no route changes. The factory pattern (`createAchievementsHandler(repo)`) enables full dependency injection in tests.

---

## ADR-013: Category Domain Layer as Source of Truth

**Status:** Accepted

**Context:** `src/domain/categories/index.ts` imported from `src/lib/categories.ts`, inverting the intended dependency direction. The domain layer should be the authoritative source; `src/lib/` modules should be backward-compatibility shims.

**Decision:** Move the canonical category definitions (interfaces, constants, functions) into `src/domain/categories/index.ts`. Convert `src/lib/categories.ts` into a deprecated re-export shim pointing at the domain module.

**Consequences:** The domain layer (`src/domain/categories/`) is now self-contained with zero dependencies on `src/lib/`. Existing consumers importing from `@/lib/categories` continue to work via the shim. New code should import from `@/domain/categories`.

---

## ADR-014: Elimination of Peer-Voting Pillar

**Status:** Accepted — Supersedes ADR-004

**Context:** ADR-004 introduced a third voting pillar ("Peer Review") where bands could vote for each other, protected by a clique-coefficient anti-collusion graph algorithm. In practice this created significant complexity (triadic census, Mahalanobis distance anomaly detection, intellectual distance scoring) while remaining fundamentally vulnerable to sophisticated collusion rings. More importantly, allowing bands to influence chart outcomes creates an inherent conflict of interest that undermines platform trust. The academic elegance of the anti-collusion system does not outweigh the perception problem: fans and DJs assume bands vote strategically, not fairly.

**Decision:** Remove the peer-voting pillar entirely. The chart scoring model is reduced to two pillars: Fan (Quadratic Voting) and DJ (Schulze Ranked Choice). All peer-voting domain files (`peer.ts`, `triadicCensus.ts`, `mahalanobis.ts`, `intellectualDistance.ts`) are deleted. The `PillarWeights` type now contains only `fan` and `dj`. Category weights are updated to sum to 1.0 across the two pillars. The default equal-weight fallback changes from 1/3 to 0.5 per pillar.

**Consequences:** Simpler, more trustworthy system. ~20 kB of anti-collusion code eliminated. Category weights redistributed according to the v2 weight matrix (see ADR-017). The monthly fan credit budget is raised from 100 to 150 credits to compensate for the removed peer pillar's influence. All tests updated to reflect 2-pillar model.

---

## ADR-015: Genre Taxonomy (23 Sub-Genres, Hierarchical)

**Status:** Accepted

**Context:** The original genre model used only 3 coarse genres (`Goth`, `Metal`, `Dark Electro`). This fails to represent the rich diversity of the dark music scene — genres like EBM, Darkwave, Neofolk, Aggrotech, and Post-Punk are distinct scenes with their own venues, DJs, and fan bases. A band misclassified as "Metal" when they play "Neue Deutsche Härte" will feel unrepresented and disengage from the platform.

**Decision:** Introduce a hierarchical genre taxonomy in `src/domain/genres/taxonomy.ts` with 5 root categories and 23 sub-genres:

- **Gothic** (5): Darkwave, Deathrock, Gothic Rock, Ethereal Wave, Gothic Metal
- **Electronic** (7): EBM, Dark Electro, Aggrotech, Futurepop, Synthpop, Industrial, Witch House
- **Metal-Adjacent** (4): Neue Deutsche Härte, Symphonic Metal, Doom Metal, Black Metal / DSBM
- **Folk & Ambient** (4): Neofolk, Dark Ambient, Martial Industrial, Medieval / Mittelalterrock
- **Post-Punk / Neue Welle** (3): Post-Punk Revival, Coldwave, Neue Deutsche Welle

Bands may select 1–3 genre tags (1 primary + up to 2 secondary). The `validateBandGenres()` function enforces the 3-genre cap and validates against the taxonomy.

**Consequences:** Bands self-identify within their actual scene. DJs can filter their Schulze ballots by genre root. Future features (genre-filtered charts, genre-specific DJ pools) become trivially implementable.

---

## ADR-016: Release-Level Voting (DJs Rank Releases, Not Tracks)

**Status:** Accepted

**Context:** The original DJ voting model had DJs rank individual tracks via Schulze ballots. In reality, DJs evaluate full releases (albums, EPs, singles) when deciding what to play. A single track is rarely representative of an artist's output or club-readiness. Release-level voting allows DJs to consider the complete work.

**Decision:** Extend the release domain model (`src/domain/releases/index.ts`) with a `Release` interface, `PlatformLink` type, `validateRelease()` function, and `canSubmitToCategory()` function. DJs submit ranked-choice ballots over releases. The `canSubmitToCategory()` function enforces type constraints (albums/EPs → album categories, singles → track categories). Streaming links support 6 platforms (Spotify, Apple Music, YouTube Music, Bandcamp, Tidal, Deezer) to avoid vendor lock-in.

**Consequences:** More authentic DJ voting. Bands submit releases (not just tracks) for DJ evaluation. The platform becomes platform-agnostic — Bandcamp artists are no longer second-class citizens.

---

## ADR-017: Two-Pillar Weighted Scoring (Dynamic Fan/DJ Weights Per Category)

**Status:** Accepted

**Context:** With peer voting removed (ADR-014), category weights needed to be re-calibrated. Different categories have genuinely different audiences: "Best Cover Art" is inherently a fan-preference question; "Synthesis & Steel" (genre fusion) requires expert DJ judgment; "Riff Architect" rewards technical skill that trained ears evaluate better.

**Decision:** Define a category-specific weight matrix where `fanWeight + djWeight = 1.0` for all 13 categories:

| Category | Fan | DJ |
|---|---|---|
| Track of the Month | 0.55 | 0.45 |
| Album of the Month | 0.40 | 0.60 |
| Voice of the Void | 0.35 | 0.65 |
| Riff Architect | 0.35 | 0.65 |
| Synthesis & Steel | 0.30 | 0.70 |
| Best Cover Art | 0.80 | 0.20 |
| Best Merch | 0.85 | 0.15 |
| Best Music Video | 0.60 | 0.40 |
| Chronicler of the Night | 0.70 | 0.30 |
| Dark Integrity Award | 0.65 | 0.35 |
| Lyricist of the Shadows | 0.40 | 0.60 |
| Underground Anthem | 0.45 | 0.55 |
| Dark Concept | 0.40 | 0.60 |

The `resolveWeights()` function in `combined.ts` returns these per-category weights; the overall chart fallback is 0.5/0.5.

**Consequences:** Visual/fan-preference categories remain fan-dominated. Technical/craft categories give DJs majority influence. The weights are transparent and published in `CATEGORY_DEFINITIONS`, visible in the UI via `appliedWeights` in every `CombinedScore`.
