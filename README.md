# darkTunes Charts

**Fair · Transparent · Innovative** — A democratic music chart platform for the dark music scene (Goth, Metal, Dark Electro).

> 🇩🇪 [Schnellstart-Guide (Deutsch)](./QUICKSTART.md#deutsch) · [Benutzerhandbuch](./docs/HANDBUCH_DE.md)
> 🇬🇧 [Quick Start Guide (English)](./QUICKSTART.md#english) · [User Manual](./docs/MANUAL_EN.md)

---

## Overview

darkTunes Charts replaces pay-to-win chart systems with a **three-pillar voting architecture**:

| Pillar | Method | Score Weight |
|---|---|---|
| **Fan Voting** | Quadratic Voting (100 credits/month) | 33.3% |
| **DJ Choice** | Schulze (Beatpath) Condorcet method | 33.3% |
| **Peer Review** | Clique-weighted anti-collusion network | 33.3% |

**Key guarantees:**
- Zero advertisements
- Financial contributions have **no influence** on rankings
- Full public audit trail (Transparency Log)
- GDPR-compliant, WCAG 2.1 accessible

---

## Repository Structure

```
darktunes-charts/
├── api/                        # Vercel Serverless Functions (backend)
│   ├── _lib/                   # Shared service layer
│   │   ├── store.ts            # In-memory data store (seeded with 76 bands)
│   │   ├── data-processor.ts   # Chart computation & normalisation
│   │   ├── csv-parser.ts       # Streaming CSV parser
│   │   ├── validators.ts       # Zod schemas + field validators
│   │   ├── error-handler.ts    # HTTP helpers (sendJson, sendError)
│   │   └── cors.ts             # CORS header management
│   ├── votes/
│   │   ├── fan.ts              # POST /api/votes/fan  (Quadratic Voting)
│   │   ├── dj.ts               # POST /api/votes/dj   (Schulze ballot)
│   │   └── peer.ts             # POST /api/votes/peer (clique-weighted)
│   ├── bands.ts                # GET/POST /api/bands
│   ├── tracks.ts               # GET/POST /api/tracks
│   ├── charts.ts               # GET /api/charts
│   ├── transparency.ts         # GET/POST /api/transparency
│   ├── bot-detection.ts        # GET/PUT /api/bot-detection
│   ├── categories.ts           # GET /api/categories
│   ├── ai-prediction.ts        # GET /api/ai-prediction
│   └── spotify.ts              # GET /api/spotify
├── src/
│   ├── domain/                 # Pure business logic (Clean Architecture)
│   │   ├── voting/             # QV, Schulze, peer, tiers, audit, prediction
│   │   └── categories/         # Category definitions & eligibility
│   ├── infrastructure/
│   │   └── api/                # iTunes & Odesli API adapters
│   ├── lib/                    # Backward-compat re-export shims
│   ├── components/             # Shared UI components
│   ├── features/               # Page-level views (fan-vote, dj-voting, ...)
│   └── app/                    # App entry point & routing
├── docs/
│   ├── HANDBUCH_DE.md          # Vollständiges Benutzerhandbuch (Deutsch)
│   └── MANUAL_EN.md            # Complete user manual (English)
├── .env.example                # All environment variables documented
├── QUICKSTART.md               # Bilingual quick start guide
├── ARCHITECTURE.md             # Architecture Decision Records (ADR-001–009)
├── CHANGELOG.md                # Versioned change history
├── SECURITY.md                 # Security policy
├── vercel.json                 # Vercel deployment configuration
└── vercel-deploy.sh            # One-step deployment script
```

---

## Quick Start

```bash
# 1. Clone & install
git clone https://github.com/Neuroklast/darktunes-charts.git
cd darktunes-charts
npm install

# 2. Configure environment variables (optional for dev)
cp .env.example .env.local

# 3. Start development server
npm run dev
# → http://localhost:5173
```

### Available Commands

| Command | Description |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build |
| `npm test` | Run all 115 tests |
| `npm run test:coverage` | Tests with coverage report |
| `npm run lint` | Code quality check |

---

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for full ADR documentation (ADR-001 through ADR-009).

**Domain Layer** (`src/domain/`): Pure TypeScript business logic — zero React/network dependencies.
**Infrastructure Layer** (`src/infrastructure/`): External API adapters (iTunes, Odesli).
**API Layer** (`api/`): Vercel Serverless Functions with Zod validation.

---

## Deployment

### Prerequisites

- Node.js ≥ 20, npm ≥ 9
- Vercel CLI: `npm install -g vercel`
- Vercel account: `vercel login`

### One-Step Deploy

```bash
# Preview
./vercel-deploy.sh --preview

# Production
./vercel-deploy.sh
```

The script runs: dependency install → TypeScript check → tests → build → deploy.

### Manual Deploy (Vercel Dashboard)

1. Import repository at [vercel.com/new](https://vercel.com/new)
2. Framework: **Vite** (auto-detected)
3. Build command: `npm run build`
4. Output directory: `dist`

### Environment Variables

Configure in **Vercel project settings → Environment Variables**:

| Variable | Required | Description |
|---|---|---|
| `SPOTIFY_CLIENT_ID` | Production | Spotify Web API client ID |
| `SPOTIFY_CLIENT_SECRET` | Production | Spotify Web API client secret |
| `EXCHANGE_RATE_API_KEY` | Optional | Exchange rate API for currency conversion |

Full variable reference: [`.env.example`](./.env.example)

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/bands` | List all registered bands |
| `POST` | `/api/bands` | Register a new band |
| `GET` | `/api/tracks` | List all tracks |
| `POST` | `/api/tracks` | Submit a new track |
| `GET` | `/api/charts?limit=N` | Get chart rankings |
| `GET` | `/api/categories` | Get category definitions |
| `GET POST` | `/api/votes/fan` | Fan quadratic votes |
| `GET POST` | `/api/votes/dj` | DJ ranked ballots + Schulze result |
| `GET POST` | `/api/votes/peer` | Peer review votes |
| `GET POST` | `/api/transparency` | Transparency log |
| `GET PUT` | `/api/bot-detection` | Bot detection alerts |
| `GET` | `/api/ai-prediction?bandId=X` | AI breakthrough prediction |
| `GET` | `/api/spotify?bandId=X` | Spotify listener data |

---

## Demo Accounts

Available in development (password: `demo1234`):

| Email | Role |
|---|---|
| `admin@darktunes.com` | Admin |
| `dj@darktunes.com` | Verified DJ |
| `band@darktunes.com` | Band (CZARINA) |
| `editor@darktunes.com` | Editor |
| `fan@darktunes.com` | Fan |

---

## Testing

```bash
npm test               # 115 tests across 8 test files
npm run test:coverage  # with coverage report
```

Coverage:
- `src/lib/__tests__/` — voting algorithms, categories, seed data, kv-shim
- `api/__tests__/` — store, data-processor, validators, csv-parser

---

## Documentation

| Document | Language | Description |
|---|---|---|
| [QUICKSTART.md](./QUICKSTART.md) | 🇩🇪 🇬�� | Bilingual quick start |
| [docs/HANDBUCH_DE.md](./docs/HANDBUCH_DE.md) | 🇩🇪 | Vollständiges Benutzerhandbuch |
| [docs/MANUAL_EN.md](./docs/MANUAL_EN.md) | 🇬🇧 | Complete user manual |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 🇬🇧 | Architecture Decision Records |
| [CHANGELOG.md](./CHANGELOG.md) | 🇬🇧 | Version history |
| [SECURITY.md](./SECURITY.md) | 🇬🇧 | Security policy |
| [.env.example](./.env.example) | 🇬🇧 | Environment variable reference |

---

## License

MIT — See [LICENSE](./LICENSE)
