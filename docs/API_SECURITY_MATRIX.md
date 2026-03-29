# API Endpoint Security Matrix

This document records the authentication and authorization requirements for every API endpoint. It is auto-generated from the codebase and should be kept in sync.

## Legend

| Symbol | Meaning |
|--------|---------|
| 🔓 | Authentication required |
| 🌐 | Public (no auth) |
| 🛡️ | Role-restricted |
| ⏱️ | Rate limited |

## Endpoints

| Endpoint | Method | Auth | Allowed Roles | Rate Limit | Description |
|----------|--------|------|---------------|------------|-------------|
| `/api/achievements` | GET | 🔓 | Any authenticated | — | User achievements (session-based, no IDOR) |
| `/api/awards` | GET | 🌐 | — | — | List all awards |
| `/api/awards` | POST | 🔓🛡️ | `admin` | — | Create award |
| `/api/bands` | GET | 🌐 | — | ⏱️ 60/min/IP | List bands |
| `/api/bands` | POST | 🔓🛡️ | `band` | — | Register band |
| `/api/bot-detection` | GET | 🔓🛡️ | `admin` | — | View bot alerts |
| `/api/bot-detection` | POST | 🔓 | Any authenticated | — | Submit analysis data |
| `/api/bot-detection` | PUT | 🔓🛡️ | `admin` | — | Update alert status |
| `/api/charts` | GET | 🌐 | — | ⏱️ 60/min/IP | Chart data |
| `/api/events` | GET | 🌐 | — | — | List events |
| `/api/events` | POST | 🔓🛡️ | `admin`, `editor` | — | Create event |
| `/api/export` | GET | 🔓🛡️ | `label`, `ar`, `admin` | — | A&R CSV export |
| `/api/mandates` | GET | 🔓 | Any authenticated | — | View mandates |
| `/api/mandates` | POST | 🔓🛡️ | `band` | — | Grant mandate |
| `/api/mandates` | DELETE | 🔓🛡️ | `band`, `label` | — | Revoke mandate |
| `/api/spotify` | GET | 🌐 | — | — | Spotify data (validated artistId) |
| `/api/tracks` | GET | 🌐 | — | ⏱️ 60/min/IP | List tracks |
| `/api/tracks` | POST | 🔓🛡️ | `band` | — | Submit track |
| `/api/votes/fan` | POST | 🔓🛡️ | `fan` | ⏱️ 10/min/user | Fan QV vote |
| `/api/votes/dj` | POST | 🔓🛡️ | `dj` | ⏱️ 10/min/user | DJ Schulze ballot |
| `/api/votes/peer` | POST | 🔓🛡️ | `band` | ⏱️ 10/min/user | Peer vote |

## CORS

CORS headers are configured globally in `next.config.ts` for all `/api/*` routes:
- `Access-Control-Allow-Origin`: Production site URL (or localhost in dev)
- `Access-Control-Allow-Methods`: GET, POST, PUT, DELETE, OPTIONS
- `Access-Control-Allow-Headers`: Content-Type, Authorization, X-Requested-With
- `Access-Control-Allow-Credentials`: true
- `Access-Control-Max-Age`: 86400 (24 hours)

## Rate Limiting

Rate limits are configured in `src/infrastructure/security/rateLimitConfig.ts`:

| Limiter | Window | Max Requests | Applied To |
|---------|--------|-------------|------------|
| `VOTE_RATE_LIMIT` | 60s | 10 | Voting endpoints |
| `PUBLIC_RATE_LIMIT` | 60s | 60 | Public GET endpoints |
| `WRITE_RATE_LIMIT` | 60s | 20 | Authenticated write endpoints |
| `ADMIN_RATE_LIMIT` | 60s | 30 | Admin endpoints |

## RBAC Middleware

The `withAuth` middleware (`src/infrastructure/security/rbac.ts`):
1. Verifies Supabase session via `auth.getUser()`
2. Looks up user role from the database (never trusts JWT claims alone)
3. Checks role against the allowed roles list
4. Returns `401 Unauthorized` for missing sessions or unknown users
5. Returns `403 Forbidden` for insufficient role permissions
