# AGENTS.md — darkTunes Charts

> **Living specification for AI coding agents and human contributors.**
> After every session, update this file along with `README.md`, `DEPLOYMENT.md`, `INTEGRATION-SUMMARY.md`, and `CHANGELOG.md`.

---

## 1. Technology Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | **Next.js 15** App Router | SSR/SSG, Server Components, Server Actions |
| Language | **TypeScript** (strict mode) | `any` is **forbidden** |
| UI | **React 19** | Functional components only |
| Styling | **Tailwind CSS v4** | Utility-first, dark theme |
| Database ORM | **Prisma** | Type-safe queries, migrations via `prisma migrate` |
| Auth & DB | **Supabase** | PostgreSQL + row-level security + auth |
| Animation | **Framer Motion** | Motion components, `useReducedMotion` required |
| Smooth Scroll | **Lenis** | Single `LenisProvider`, `useLenis()` hook |
| Icons | **@phosphor-icons/react** | **NO heroicons, NO lucide-react** |
| i18n | **next-intl** | `src/i18n/request.ts`, Server Components only |
| Testing | **Vitest** (unit) + **Playwright** (E2E) | Mock all external APIs |
| Deployment | **Vercel** | `vercel.json` + `scripts/vercel-install.sh` |
| Error Monitoring | **Sentry** (optional) | `SENTRY_DSN` in `.env` |

---

## 2. Brand Colors

All color tokens are defined in `src/styles/globals.css` (Tailwind v4 CSS variables).

| Token | CSS Variable | Hex | Usage |
|---|---|---|---|
| Primary | `--primary` | `#493687` | Violet — CTA buttons, active states |
| Secondary | `--secondary` | `#7e1e37` | Pink — accents, hover states |
| Background | `--background` | `#101010` | Page background |
| Card | `--card` | `#292929` | Card / panel background |
| Border | `--border` | `#383838` | Dividers, outlines |
| Foreground | `--foreground` | `#ffffff` | Primary text |

> **Rule:** Never hardcode hex values in components. Always use the CSS token (e.g. `bg-primary`, `text-foreground`).

---

## 3. Clean Code Rules

| Rule | Detail |
|---|---|
| **SRP** | One file, one responsibility. No file > 300 lines without a justified split. |
| **DRY** | Extract repeated logic into shared utilities in `src/lib/`. |
| **YAGNI** | Do not implement features not required by the current task. |
| **KISS** | Prefer simple, readable code over clever one-liners. |
| **No `any`** | Use `unknown` + type guards when types are uncertain at runtime. |
| **No prop drilling > 2 levels** | Use Context API or pass through `component-contracts.ts` interfaces. |
| **Early returns** | Avoid deeply nested `if/else`. Return early on error/guard conditions. |
| **Named constants** | No magic strings or magic numbers — use constants in `src/lib/` or `src/domain/`. |
| **No silent errors** | Every `catch` block must log or surface the error. Never swallow. |

---

## 4. Architecture Rules (DDD / Clean Architecture)

```
src/
├── domain/           # Pure business logic — NO React, NO network
│   ├── voting/       # QV, Schulze, Tier system, audit trail
│   ├── categories/   # Genre taxonomy, eligibility rules
│   ├── events/       # Domain EventBus (publish/subscribe)
│   └── repositories/ # Repository interfaces (contracts only, no implementations)
├── application/      # Use-cases — orchestrate domain + infrastructure
├── infrastructure/   # Implementations (Prisma repos, external APIs, cache)
├── presentation/     # Shared UI primitives (not page components)
├── features/         # Feature modules — each owns its UI + hooks + types
├── lib/              # Cross-cutting utilities (errors, imageUtils, etc.)
├── hooks/            # Global React hooks
├── components/       # Shared generic components
└── app/              # Next.js App Router pages and layouts
```

### Layer Interaction Rules

1. `domain/` must never import from `infrastructure/`, `presentation/`, or `app/`.
2. `application/` may import from `domain/` and `infrastructure/`.
3. `features/` may import from `application/`, `domain/`, `lib/`, and `components/`.
4. `app/` (pages/layouts) may import from `features/`, `components/`, `hooks/`.
5. Cross-feature imports are **forbidden** — use domain events or context instead.

### Repository Pattern

```typescript
// src/domain/repositories/IBandRepository.ts — interface only
export interface IBandRepository {
  findById(id: string): Promise<Band | null>
  findAll(filters: BandFilters): Promise<Band[]>
  save(band: Band): Promise<void>
}

// src/infrastructure/repositories/PrismaBandRepository.ts — implementation
export class PrismaBandRepository implements IBandRepository {
  constructor(private readonly db: PrismaClient) {}
  // ...
}
```

> **Rule:** API routes must NEVER call Prisma directly. Always go through a repository.

---

## 5. Lenis Smooth Scrolling

- **Single instance:** Lenis is initialised once in `src/app/_components/Providers.tsx`.
- **Hook:** Use `useLenis()` to access the Lenis instance in any Client Component.
- **Forbidden:** Never use `scroll-behavior: smooth` in CSS — it conflicts with Lenis.
- **Reduced motion:** Lenis automatically respects `prefers-reduced-motion`.

```tsx
// In Providers.tsx
import Lenis from 'lenis'
import { useLenis } from 'lenis/react'

// In a component
const lenis = useLenis()
lenis?.scrollTo('#section-id')
```

---

## 6. WCAG 2.1 AA/AAA Accessibility

| Requirement | Implementation |
|---|---|
| Reduced motion | `useReducedMotion()` in every animated component — disable/slow animations when true |
| Touch targets | Minimum 44×44 px for all interactive elements |
| Skip nav link | `<a href="#main-content">` as first element in root layout |
| ARIA labels | All icon-only buttons must have `aria-label` |
| Semantic HTML | Use `<main>`, `<nav>`, `<section>`, `<article>`, `<header>`, `<footer>` |
| Color contrast | Minimum 4.5:1 for normal text, 3:1 for large text |
| Focus visible | Never remove `:focus-visible` outlines |

---

## 7. DAL Pattern (Data Access Layer)

### How to write Prisma queries

```typescript
// ✅ Correct — in src/infrastructure/repositories/PrismaBandRepository.ts
export class PrismaBandRepository implements IBandRepository {
  async findById(id: string): Promise<Band | null> {
    const row = await this.db.band.findUnique({ where: { id } })
    return row ? toDomain(row) : null
  }
}

// ❌ Wrong — never call Prisma in an API route handler
export async function GET(req: NextRequest) {
  const bands = await prisma.band.findMany() // ← forbidden
}
```

### `unstable_cache` for Server Components

```typescript
import { unstable_cache } from 'next/cache'

const getBands = unstable_cache(
  async () => bandRepository.findAll({}),
  ['bands'],
  { revalidate: 60, tags: ['bands'] },
)
```

---

## 8. API Route Rules

All API route handlers **must** be wrapped with `withErrorHandler`:

```typescript
import { withErrorHandler, ApiError } from '@/lib/errors'
import { MySchema } from '@/lib/schemas'

export const POST = withErrorHandler(async (req) => {
  const body = MySchema.parse(await req.json())  // throws ZodError → 400
  if (!body.bandId) throw new ApiError(404, 'Band not found', 'BAND_NOT_FOUND')
  // ...
  return NextResponse.json({ ok: true })
})
```

**Response shape:**
```json
// Success
{ "data": { ... } }

// Error (ApiError)
{ "error": "Band not found", "code": "BAND_NOT_FOUND", "status": 404 }

// Validation error (ZodError)
{ "error": "Validation error", "code": "VALIDATION_ERROR", "status": 400, "details": [...] }
```

---

## 9. Error Handling

- **`ApiError`** — typed HTTP errors, always caught by `withErrorHandler`.
- **`withErrorHandler`** — HOC that wraps every API route handler.
- Both are exported from `src/lib/errors.ts`.
- **`app/error.tsx`** — Next.js route-segment error boundary.
- **`app/global-error.tsx`** — Catches errors in root layout, renders `<html>` + `<body>`.

---

## 10. Image Optimisation

Always use `src/lib/imageUtils.ts` — never load images directly from Spotify CDN:

```typescript
import { getOptimizedImageUrl, getSquareThumbnail } from '@/lib/imageUtils'

// Full width image
<Image src={getOptimizedImageUrl(band.coverUrl, 800)} width={800} height={450} />

// Square thumbnail
<Image src={getSquareThumbnail(band.coverUrl, 64)} width={64} height={64} />
```

- Proxy: **wsrv.nl** (open-source, no API key required)
- Output format: **WebP** (≈ 30 % smaller than JPEG)
- Quality: **85** (visually lossless)

---

## 11. Caching

Use `unstable_cache` with `revalidate` and `tags` in all Server Components that hit the DB:

```typescript
const getData = unstable_cache(
  async () => repository.findAll(),
  ['cache-key'],
  { revalidate: 60, tags: ['entity-name'] }
)
```

- `revalidate: 60` — stale-while-revalidate every 60 seconds.
- `tags` — allow targeted cache invalidation via `revalidateTag('entity-name')`.
- Never call `unstable_cache` inside a Client Component or dynamic route handler.

---

## 12. i18n Rules

- Library: **next-intl**
- Config: `src/i18n/request.ts`
- Supported locales: `de` (default), `en`
- URL strategy: `localePrefix: 'as-needed'` — default locale has no prefix

**Rules:**
1. `useTranslations()` is Server Component only.
2. Pass translation strings as props to Client Components — never call `useTranslations()` on the client.
3. All translation files live in `messages/` at the repository root.
4. Never hardcode user-facing strings in components — always use translation keys.

---

## 13. Testing

| Type | Tool | Location | Rule |
|---|---|---|---|
| Unit | **Vitest** | `src/__tests__/` | Mock all external APIs and DB calls |
| E2E | **Playwright** | `e2e/` | Test full user flows |
| Coverage | `vitest --coverage` | — | Target: 80 %+ on domain logic |

- Run tests: `npm test`
- Run E2E: `npm run test:e2e`
- Always update tests when changing business logic.

---

## 14. Security

| Mechanism | Location | Details |
|---|---|---|
| Security headers | `middleware.ts` (root) | `applySecurityHeaders()` — HSTS, CSP, X-Frame-Options, etc. |
| Static asset caching | `vercel.json` | `Cache-Control: public, max-age=31536000, immutable` |
| HSTS | `vercel.json` + middleware | `max-age=63072000; includeSubDomains; preload` |
| Session refresh | `src/lib/supabase/middleware.ts` | Called on every request in `middleware.ts` |
| Auth guards | `middleware.ts` | Protected routes listed in `PROTECTED_PREFIXES` |
| Env validation | `scripts/vercel-install.sh` | Fails build if required vars are missing |
| Sensitive data | Never | Do NOT log passwords, tokens, or API secrets |

---

## 15. Schema Change Checklist

When the Prisma schema (`prisma/schema.prisma`) changes:

- [ ] Run `npx prisma migrate dev --name <description>` to create a migration
- [ ] Run `npx prisma generate` to regenerate the Prisma client
- [ ] Update affected repository implementations in `src/infrastructure/repositories/`
- [ ] Update domain entity types in `src/domain/`
- [ ] Update Zod validation schemas in `src/lib/schemas/` or `src/app/api/*/`
- [ ] Update seeder if new required fields were added (`prisma/seed.ts`)
- [ ] Update `CHANGELOG.md` with the schema change

---

## 16. Agent Workflow

After every coding session:

1. Update `AGENTS.md` — add any new rules, patterns, or conventions discovered.
2. Update `README.md` — reflect structural or feature changes.
3. Update `DEPLOYMENT.md` — reflect new environment variables or deployment steps.
4. Update `INTEGRATION-SUMMARY.md` — move items from "Pending" to "Implemented".
5. Update `CHANGELOG.md` — add an entry under "Unreleased" (Added / Changed / Fixed).
6. Update `.env.example` — add documentation for any new environment variables.

---

## 17. Voting System

### Two-Pillar Model (ADR-014, ADR-017)

> The original three-pillar model (Fan + DJ + Peer Review) was superseded.
> As of ADR-014, the system uses **two pillars only**:

| Pillar | Method | Weight |
|---|---|---|
| **Fan Voting** | Quadratic Voting (100 credits/month) | 50 % |
| **DJ Choice** | Schulze (Beatpath) Condorcet method | 50 % |

Peer Review was removed (ADR-014) due to collusion risk and implementation complexity.

### Tier System (ADR-003, ADR-010)

Bands are assigned to tiers based on cumulative score thresholds:

| Tier | Name | Score Range |
|---|---|---|
| 1 | Emerging | 0 – 999 |
| 2 | Rising | 1 000 – 4 999 |
| 3 | Established | 5 000 – 14 999 |
| 4 | Headliner | 15 000+ |

Tier assignments are recomputed weekly by the `api/cron/tier-refresh` cron job.

### Genre Taxonomy (ADR-015)

Top-level genres: `Gothic`, `Metal`, `Dark Electro`, `Industrial`, `Darkwave`, `EBM`, `Neoclassical`, `Ambient Dark`.

Each genre has sub-categories stored in `src/domain/categories/`.

---

## 18. Forbidden Anti-Patterns

| Pattern | Why Forbidden | Alternative |
|---|---|---|
| `@heroicons/react` | Not in approved stack (AGENTS.md) | `@phosphor-icons/react` |
| `lucide-react` | Not in approved stack (AGENTS.md) | `@phosphor-icons/react` |
| `any` type | Bypasses TypeScript safety | `unknown` + type guards |
| Global mutable state | Causes unpredictable renders | React Context or Zustand |
| Monolithic components (> 300 lines) | Hard to test and maintain | Split into sub-components |
| Direct Prisma calls in API routes | Bypasses repository pattern | Use repository implementations |
| `scroll-behavior: smooth` in CSS | Conflicts with Lenis | `lenis.scrollTo()` |
| Hardcoded hex colors | Breaks theme consistency | Tailwind CSS token classes |
| Silent `catch` blocks | Hides bugs | Always log or surface errors |
| Prop drilling > 2 levels | Tight coupling | Context API or component contracts |
