# darkTunes Charts

**Fair · Transparent · Innovative** — A democratic music chart platform for the dark music scene (Goth, Metal, Dark Electro).

> 🇩🇪 [Schnellstart-Guide (Deutsch)](./QUICKSTART.md#deutsch) · [Benutzerhandbuch](./docs/HANDBUCH_DE.md)
> 🇬🇧 [Quick Start Guide (English)](./QUICKSTART.md#english) · [User Manual](./docs/MANUAL_EN.md)

---

## Overview

darkTunes Charts replaces pay-to-win chart systems with a **two-pillar voting architecture**:

| Pillar | Method | Score Weight |
|---|---|---|
| **Fan Voting** | Quadratic Voting (100 credits/month) | 50 % |
| **DJ Choice** | Schulze (Beatpath) Condorcet method | 50 % |

**Key guarantees:**
- Zero advertisements
- Financial contributions have **no influence** on rankings
- Full public audit trail (Transparency Log)
- GDPR-compliant, WCAG 2.1 accessible

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 15 App Router | SSR, routing, Server Components |
| React | 19 | UI library |
| TypeScript | 5.7 | Strict typing |
| Supabase | — | PostgreSQL + Auth |
| Prisma | 7 | Type-safe ORM + migrations |
| Tailwind CSS | v4 | Utility-first styling |
| Framer Motion | 12 | Animations |
| next-intl | 4 | Internationalisation (de/en) |
| Vitest | — | Unit testing |
| Playwright | — | End-to-end testing |
| Vercel | — | Deployment |

---

## Brand Colors

| Token | Hex | Usage |
|---|---|---|
| `--primary` | `#493687` | Violet — buttons, active states |
| `--secondary` | `#7e1e37` | Pink — accents |
| `--background` | `#101010` | Page background |
| `--card` | `#292929` | Card background |
| `--border` | `#383838` | Dividers |
| `--foreground` | `#ffffff` | Primary text |

---

## Repository Structure

```
darktunes-charts/
├── middleware.ts               # Next.js middleware (locale + auth + security headers)
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── [locale]/           # Internationalised routes
│   │   │   ├── (protected)/    # Auth-gated pages (dashboard, vote, admin)
│   │   │   └── (public)/       # Public pages (charts, bands, login)
│   │   ├── api/                # API route handlers
│   │   ├── error.tsx           # Route-segment error boundary
│   │   ├── global-error.tsx    # Global error boundary
│   │   └── layout.tsx          # Root layout
│   ├── domain/                 # Pure business logic (no React/network)
│   │   ├── voting/             # QV, Schulze, Tier system, audit trail
│   │   ├── categories/         # Genre taxonomy, eligibility
│   │   ├── events/             # Domain EventBus
│   │   └── repositories/       # Repository interfaces
│   ├── application/            # Use-cases — orchestrate domain + infra
│   ├── infrastructure/         # Prisma repos, external API adapters
│   ├── features/               # Feature modules (fan-vote, dj-voting, ...)
│   ├── lib/                    # Cross-cutting utilities
│   │   ├── errors.ts           # ApiError + withErrorHandler
│   │   ├── imageUtils.ts       # wsrv.nl image proxy helpers
│   │   ├── component-contracts.ts  # Shared prop interfaces
│   │   └── supabase/           # Supabase client/server/middleware
│   ├── components/             # Shared generic UI components
│   ├── hooks/                  # Global React hooks
│   ├── workers/                # Web Workers (compute-intensive tasks)
│   └── i18n/                   # next-intl configuration
├── prisma/                     # Schema + migrations + seed
├── messages/                   # Translation files (de.json, en.json)
├── scripts/
│   └── vercel-install.sh       # Install + env validation for Vercel
├── e2e/                        # Playwright end-to-end tests
├── docs/                       # User manuals (DE + EN)
├── .env.example                # Environment variable reference
├── AGENTS.md                   # AI agent + contributor guidelines
├── ARCHITECTURE.md             # Architecture Decision Records (ADRs)
├── DEPLOYMENT.md               # Deployment guide
├── INTEGRATION-SUMMARY.md      # Implementation status
├── CHANGELOG.md                # Version history
└── vercel.json                 # Vercel configuration
```

---

## Quick Start

```bash
# 1. Clone & install
git clone https://github.com/Neuroklast/darktunes-charts.git
cd darktunes-charts
npm install

# 2. Configure environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 3. Set up the database
npm run db:migrate

# 4. Start development server
npm run dev
# → http://localhost:3000
```

### Available Commands

| Command | Description |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build |
| `npm test` | Run unit tests |
| `npm run test:coverage` | Tests with coverage report |
| `npm run test:e2e` | End-to-end tests (Playwright) |
| `npm run typecheck` | TypeScript type check |
| `npm run lint` | Code quality check |
| `npm run validate` | Prisma validate + typecheck + lint |
| `npm run db:migrate` | Run Prisma migrations (local dev) |
| `npm run db:push` | Push schema changes to dev DB |
| `npm run db:seed` | Seed the database |

---

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for full ADR documentation.
See [AGENTS.md](./AGENTS.md) for coding conventions and architecture rules.

**Domain Layer** (`src/domain/`): Pure TypeScript business logic — zero React/network dependencies.
**Application Layer** (`src/application/`): Use-cases that orchestrate domain and infrastructure.
**Infrastructure Layer** (`src/infrastructure/`): Prisma repositories, external API adapters.
**Feature Layer** (`src/features/`): Page-level views and feature-specific components.

---

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the full deployment guide.

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
2. Framework: **Next.js** (auto-detected)
3. Build command: `npx prisma generate && npx prisma migrate deploy && next build`
4. Install command: `bash scripts/vercel-install.sh`

### Environment Variables

Configure in **Vercel project settings → Environment Variables**.
Full variable reference: [`.env.example`](./.env.example)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-only) |
| `DATABASE_URL` | Yes | PostgreSQL connection string (pgBouncer) |
| `DIRECT_URL` | Yes | Direct PostgreSQL URL (for Prisma migrations) |
| `SPOTIFY_CLIENT_ID` | Production | Spotify Web API client ID |
| `SPOTIFY_CLIENT_SECRET` | Production | Spotify Web API client secret |
| `CRON_SECRET` | Production | Vercel cron job authentication secret |

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
| `GET POST` | `/api/transparency` | Transparency log |
| `GET` | `/api/ai-prediction?bandId=X` | AI breakthrough prediction |
| `GET` | `/api/spotify?bandId=X` | Spotify listener data |
| `GET` | `/api/health` | Health check (DB status + uptime) |

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
npm test               # Unit tests (Vitest)
npm run test:coverage  # With coverage report
npm run test:e2e       # End-to-end tests (Playwright)
```

Coverage:
- `src/__tests__/` — voting algorithms, image utils, categories, utilities
- `e2e/` — user flows (voting, auth, charts)

---

## Documentation

| Document | Description |
|---|---|
| [AGENTS.md](./AGENTS.md) | AI agent guidelines + coding conventions |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Architecture Decision Records (ADRs) |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Full deployment guide |
| [INTEGRATION-SUMMARY.md](./INTEGRATION-SUMMARY.md) | Implementation status |
| [QUICKSTART.md](./QUICKSTART.md) | Bilingual quick start |
| [docs/HANDBUCH_DE.md](./docs/HANDBUCH_DE.md) | Vollständiges Benutzerhandbuch (DE) |
| [docs/MANUAL_EN.md](./docs/MANUAL_EN.md) | Complete user manual (EN) |
| [CHANGELOG.md](./CHANGELOG.md) | Version history |
| [SECURITY.md](./SECURITY.md) | Security policy |
| [.env.example](./.env.example) | Environment variable reference |

---

## License

MIT — See [LICENSE](./LICENSE)
