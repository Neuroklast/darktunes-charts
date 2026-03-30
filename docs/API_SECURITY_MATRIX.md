# API Security Matrix

> This document defines the authentication and authorization requirements for every API endpoint in the DarkTunes Charts platform.

## Legend

| Symbol | Meaning |
|--------|---------|
| 🔓 | Public (no authentication required) |
| 🔑 | Authentication required (any role) |
| 🛡️ | Authentication + specific role(s) required |
| 🔒 | CRON_SECRET bearer token required |

## Endpoint Security Requirements

| Endpoint | Method | Auth | Allowed Roles | Description |
|----------|--------|------|---------------|-------------|
| `/api/achievements` | GET | 🛡️ | Any (own data), ADMIN (any user) | User achievements with IDOR protection |
| `/api/awards` | GET | 🔓 | — | List all awards |
| `/api/awards` | POST | 🛡️ | ADMIN | Create a new award |
| `/api/bands` | GET | 🔓 | — | List bands |
| `/api/bot-detection` | GET | 🛡️ | ADMIN | Bot detection alerts |
| `/api/bot-detection` | POST | 🔑 | Any authenticated | Analyse fingerprint / vote data |
| `/api/bot-detection` | PUT | 🛡️ | ADMIN | Update alert status |
| `/api/charts` | GET | 🔓 | — | Public chart data |
| `/api/events` | GET | 🔓 | — | Upcoming events |
| `/api/events` | POST | 🛡️ | ADMIN, EDITOR | Create event |
| `/api/export` | GET | 🛡️ | LABEL, AR, ADMIN | A&R CSV export |
| `/api/feedback` | POST | 🔑 | Any authenticated | Submit feedback |
| `/api/itunes` | GET | 🔓 | — | iTunes lookup |
| `/api/mandates` | GET | 🔓 | — | List mandates |
| `/api/mandates` | POST | 🛡️ | BAND, LABEL, ADMIN | Create mandate |
| `/api/mandates` | DELETE | 🛡️ | BAND, LABEL, ADMIN | Revoke mandate |
| `/api/odesli` | GET | 🔓 | — | Odesli / song.link lookup |
| `/api/profile` | GET | 🔑 | Any authenticated | User profile |
| `/api/profile` | POST | 🔑 | Any authenticated | Create / update profile |
| `/api/spotify` | GET | 🔓 | — | Spotify monthly listeners (validated input) |
| `/api/tracks` | GET | 🔓 | — | List tracks |
| `/api/transparency` | GET | 🔓 | — | Transparency log |
| `/api/cron/achievement-check` | POST | 🔒 | CRON_SECRET | Evaluate achievements |
| `/api/cron/random-band` | GET | 🔒 | CRON_SECRET | Band of the Day selection |
| `/api/cron/schulze-compute` | GET | 🔒 | CRON_SECRET | Schulze ranking recompute |

## CORS Policy

All `/api/*` routes include explicit CORS headers configured in `next.config.ts`:

- **Allowed Origin**: Production domain (`CORS_ALLOWED_ORIGIN` env var, defaults to `https://darktunes.com`)
- **Allowed Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Allowed Headers**: Content-Type, Authorization
- **Credentials**: Allowed
- **Max Age**: 86400 seconds (24 hours)

## OWASP References

| Control | OWASP Category |
|---------|---------------|
| Authentication checks | A07:2021 — Identification and Authentication Failures |
| Role-based access control | A01:2021 — Broken Access Control |
| Input validation (Zod schemas) | A03:2021 — Injection |
| IDOR protection (achievements) | A01:2021 — Broken Access Control |
| CORS configuration | A05:2021 — Security Misconfiguration |
