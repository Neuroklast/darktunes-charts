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

**Context:** The platform previously used `@github/spark`'s `useKV` hook for all persistent state. The GitHub Spark dependency has been removed as part of the production-readiness migration.

**Decision:** Implement a drop-in `useKV(key, defaultValue)` shim in `src/lib/kv-shim.ts` backed by `localStorage`. The hook interface is identical to the former Spark hook so all call sites required only a single import path change. KV keys are namespaced with a `kv:` prefix internally.

**Consequences:** State is per-device (localStorage). For multi-device sync and shared state, consumers must migrate to API-backed hooks (see ADR-006). The shim removes the Spark platform dependency entirely, enabling Vercel deployment.

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

**Status:** Accepted

**Context:** The project must deploy as a single Vercel project that serves both the Vite-built SPA and the serverless API functions.

**Decision:** Configure `vercel.json` at the repository root with:
- `buildCommand: npm run build` — runs `tsc -b --noCheck && vite build` producing `dist/`
- `outputDirectory: dist` — Vite output served as static assets
- `functions."api/**/*.ts": { runtime: "nodejs22.x" }` — TypeScript API routes compiled by Vercel
- URL rewrites: `/api/:path*` → serverless functions; `(.*)` → `index.html` (SPA fallback)
- Security headers on all routes: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`
- `vercel-deploy.sh` provides a one-step deploy script with pre-flight checks (node, npm, typecheck, tests, build)

**Consequences:** Single `vercel deploy` command deploys both frontend and backend. No separate API server required. Environment variables (`SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `EXCHANGE_RATE_API_KEY`) must be configured in the Vercel project settings before live Spotify/exchange-rate integration.
