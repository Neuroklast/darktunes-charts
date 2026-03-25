# darkTunes Charts

**Fair · Transparent · Innovative** — A democratic music charting platform for the dark music scene (Goth, Metal, Dark Electro).

## Overview

darkTunes Charts replaces pay-to-win chart systems with a three-pillar voting architecture:

- **Fan Voting** – quadratic voting with 100 monthly voice credits
- **DJ Choice** – Schulze (Beatpath) Condorcet method for ranked-choice ballots
- **Peer Review** – clique-coefficient weighted band-to-band voting

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for full ADR (Architecture Decision Record) documentation.

```
darktunes-charts/
├── api/                    # Vercel Serverless Functions (backend)
│   ├── _lib/               # Shared service layer (not exposed as routes)
│   │   ├── store.ts        # In-memory data store (seeded with 76 bands)
│   │   ├── data-processor.ts  # Chart computation & category filtering
│   │   ├── csv-parser.ts   # Streaming CSV parser
│   │   ├── validators.ts   # Zod schemas + EAN/date/amount validators
│   │   ├── error-handler.ts
│   │   └── cors.ts
│   ├── votes/fan.ts        # POST /api/votes/fan
│   ├── votes/dj.ts         # POST /api/votes/dj
│   ├── votes/peer.ts       # POST /api/votes/peer
│   ├── bands.ts            # GET /api/bands
│   ├── tracks.ts           # GET /api/tracks
│   ├── charts.ts           # GET /api/charts
│   ├── transparency.ts     # GET/POST /api/transparency
│   ├── bot-detection.ts    # GET/PUT /api/bot-detection
│   ├── categories.ts       # GET /api/categories
│   ├── ai-prediction.ts    # GET /api/ai-prediction
│   └── spotify.ts          # GET /api/spotify
├── src/
│   ├── lib/
│   │   ├── kv-shim.ts      # localStorage-backed useKV compatibility hook
│   │   ├── voting.ts       # Shared voting algorithms (frontend + backend)
│   │   ├── categories.ts   # Category definitions and scoring
│   │   ├── schulze.ts      # Schulze method implementation
│   │   ├── types.ts        # Shared TypeScript interfaces
│   │   └── seedData.ts     # Canonical 76-band test dataset
│   ├── components/         # Shared UI components
│   └── features/           # Page-level feature views
├── vercel.json             # Vercel deployment configuration
└── vercel-deploy.sh        # One-step deployment script
```

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Deployment to Vercel

### Option 1: CLI Script

```bash
chmod +x vercel-deploy.sh
./vercel-deploy.sh          # production
./vercel-deploy.sh --preview # preview deployment
```

### Option 2: Vercel Dashboard

1. Import the repository at [vercel.com/new](https://vercel.com/new)
2. Framework: **Vite** (auto-detected via `vercel.json`)
3. Build command: `npm run build`
4. Output directory: `dist`

### Environment Variables

Configure these in Vercel project settings for full production integration:

| Variable | Description |
|---|---|
| `SPOTIFY_CLIENT_ID` | Spotify Web API client ID |
| `SPOTIFY_CLIENT_SECRET` | Spotify Web API client secret |
| `EXCHANGE_RATE_API_KEY` | Exchange rate service API key (optional) |

## API Reference

All API routes are available under `/api/`:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/bands` | List all registered bands |
| `POST` | `/api/bands` | Register a new band |
| `GET` | `/api/tracks` | List all tracks |
| `POST` | `/api/tracks` | Submit a new track |
| `GET` | `/api/charts?limit=N` | Get computed chart rankings |
| `GET` | `/api/categories` | Get all category definitions |
| `GET POST` | `/api/votes/fan` | Fan quadratic votes |
| `GET POST` | `/api/votes/dj` | DJ ranked ballots + Schulze result |
| `GET POST` | `/api/votes/peer` | Peer review votes |
| `GET POST` | `/api/transparency` | Transparency log |
| `GET PUT` | `/api/bot-detection` | Bot detection alerts |
| `GET` | `/api/ai-prediction?bandId=X` | AI breakthrough prediction |
| `GET` | `/api/spotify?bandId=X` | Spotify listener data |

## Testing

```bash
npm test              # Run all tests (115 tests, 8 test files)
npm run test:coverage # Run with coverage report
```

Test coverage includes:
- `src/lib/__tests__/` — voting algorithms, categories, seed data, kv-shim
- `api/__tests__/` — store, data-processor, validators, csv-parser

## License

MIT — See [LICENSE](./LICENSE)
