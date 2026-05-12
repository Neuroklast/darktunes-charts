# DEPLOYMENT.md — darkTunes Charts

> Full deployment guide for darkTunes Charts on Vercel + Supabase.

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | ≥ 20 | [nodejs.org](https://nodejs.org/) |
| npm | ≥ 9 | Bundled with Node.js |
| Vercel CLI | Latest | `npm install -g vercel` |
| Prisma CLI | Bundled | `npm run db:migrate` |

---

## 1. Vercel Deployment

### First-time setup

1. **Import the repository** at [vercel.com/new](https://vercel.com/new).
2. Select the `Neuroklast/darktunes-charts` repository.
3. Vercel will auto-detect **Next.js** — confirm the framework.
4. Set the following build settings:
   - **Build command:** `npx prisma generate && npx prisma migrate deploy && next build`
   - **Install command:** `bash scripts/vercel-install.sh`
   - **Output directory:** `.next` (default)
5. Add all required environment variables (see [Environment Variables](#3-environment-variables) section).
6. Click **Deploy**.

### Automatic deployments

- Every push to `main` triggers a **production deployment**.
- Every pull request creates a **preview deployment** with a unique URL.

### One-step deploy script

```bash
# Preview (creates a preview URL)
./vercel-deploy.sh --preview

# Production
./vercel-deploy.sh
```

The script runs in order:
1. Pre-flight checks (Node.js, npm, Vercel CLI)
2. `npm ci` — clean install
3. `npx tsc --noEmit` — type check
4. `npm test` — unit tests
5. `npm run build` — production build
6. `vercel --prod` — deploy

---

## 2. Supabase Setup

### Create a new Supabase project

1. Go to [supabase.com](https://supabase.com/) and sign in.
2. Click **New project**.
3. Choose your organisation and region (recommend `eu-central-1` for European users).
4. Set a strong database password — save it securely.

### Apply the database schema

```bash
# Set your DATABASE_URL and DIRECT_URL in .env.local first, then:
npx prisma migrate deploy
```

This applies all migrations in `prisma/migrations/` to your Supabase database.

### Create the first admin user

1. In your Supabase dashboard, go to **Authentication → Users**.
2. Click **Invite user** and enter the admin email.
3. After the user accepts the invite, go to the **SQL Editor** and run:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your-admin@email.com';
```

---

## 3. Environment Variables

Add these in **Vercel project settings → Environment Variables**.

### Client-side (exposed to browser)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL (e.g. `https://abc.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key (safe to expose) |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Canonical site URL (e.g. `https://charts.darktunes.com`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Optional | Stripe publishable key for payments |
| `NEXT_PUBLIC_SENTRY_DSN` | Optional | Sentry DSN for client-side error tracking |

### Server-side (never exposed to browser)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL URL via pgBouncer (connection pooling) |
| `DIRECT_URL` | ✅ | Direct PostgreSQL URL (used by Prisma for migrations) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key (admin access) |
| `CRON_SECRET` | ✅ | Secret for authenticating Vercel cron job requests |
| `SPOTIFY_CLIENT_ID` | Production | Spotify Web API client ID |
| `SPOTIFY_CLIENT_SECRET` | Production | Spotify Web API client secret |
| `NEXTAUTH_SECRET` | ✅ | Random 32-character string for session encryption |

### Optional integrations

| Variable | Service | Description |
|---|---|---|
| `STRIPE_SECRET_KEY` | Stripe | Secret key for payment processing |
| `STRIPE_WEBHOOK_SECRET` | Stripe | Webhook signing secret |
| `STRIPE_PRICE_PRO` | Stripe | Price ID for Pro tier |
| `STRIPE_PRICE_PRO_PLUS` | Stripe | Price ID for Pro Plus tier |
| `RESEND_API_KEY` | Resend | API key for transactional emails |
| `EMAIL_FROM` | Resend | Sender address (e.g. `DarkTunes <noreply@darktunes.com>`) |
| `DISCORD_WEBHOOK_URL` | Discord | Webhook URL for admin notifications |
| `UPSTASH_REDIS_REST_URL` | Upstash | Redis URL for distributed rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash | Redis auth token |
| `SENTRY_DSN` | Sentry | DSN for server-side error tracking |

Full reference: [`.env.example`](./.env.example)

---

## 4. Database

### How Prisma migrations work

```
prisma/
├── schema.prisma          # Source of truth for the DB schema
└── migrations/            # One folder per migration (timestamped)
    └── 20250101_init/
        └── migration.sql  # Auto-generated SQL
```

### Local development

```bash
# Create a new migration after editing schema.prisma
npm run db:migrate
# Prompts for a migration name, then applies it to your local DB

# Push schema changes without creating a migration (for rapid prototyping)
npm run db:push

# Seed the database
npm run db:seed
```

### Staging / Production

```bash
# Apply all pending migrations (no prompts — safe for CI/CD)
npx prisma migrate deploy
```

The `buildCommand` in `vercel.json` runs `npx prisma migrate deploy` automatically before every production build.

> ⚠️ **Warning:** Never run `prisma migrate dev` in production — it can alter live data. Use `migrate deploy` only.

---

## 5. Post-Deployment Checklist

After every production deployment, verify:

- [ ] `GET https://your-domain.com/api/health` returns `{ "status": "ok" }`
- [ ] Supabase Auth is reachable (try logging in with a demo account)
- [ ] Cron jobs are registered in Vercel dashboard (`/api/cron/*`)
- [ ] Spotify API credentials are valid (check band images load)
- [ ] `Strict-Transport-Security` header is present (check with browser DevTools)
- [ ] `Cache-Control: public, max-age=31536000, immutable` on `/_next/static/` assets
- [ ] Error boundary works (navigate to a non-existent route → custom 404, not white screen)
- [ ] Database migrations applied successfully (check Prisma migration table)
- [ ] Environment variables validated (check Vercel build logs for `✓ All required environment variables are set`)

---

## 6. Maintenance

### Dependency updates

```bash
# Check for outdated packages
npm outdated

# Update non-breaking dependencies
npm update

# For major version upgrades, update manually and test
```

### Database backups

Supabase automatically creates daily backups on paid plans. For additional safety:

1. Go to Supabase dashboard → **Database → Backups**.
2. Download a backup before every major migration.
3. Test restore procedures in staging before production.

### Monitoring

| Signal | Tool | Endpoint |
|---|---|---|
| Uptime | Vercel / Checkly | `GET /api/health` |
| Errors | Sentry (optional) | Dashboard |
| Performance | Vercel Analytics | Dashboard |
| DB performance | Supabase | Dashboard → Performance |

### Rolling back a deployment

```bash
# List recent deployments
vercel ls

# Promote a previous deployment to production
vercel promote <deployment-url>
```
