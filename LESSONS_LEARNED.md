# Lessons Learned — DarkTunes Development

This file documents key lessons from each development phase to avoid repeating mistakes in future iterations.

---

## Phase 4: Production-Ready & Community Growth

### LL-001: TypeScript Literal Types Require Casting for Conditional Logic

**Problem:** Declaring `const tier: 'free' | 'pro' | 'pro_plus' = 'free'` causes TypeScript to narrow the type to `'free'` literal, making comparisons like `tier === 'pro'` produce an error ("This comparison appears to be unintentional").

**Solution:** Use `const tier = 'free' as 'free' | 'pro' | 'pro_plus'` to preserve the union type without narrowing.

**Lesson:** When a constant holds a value that represents state that will change at runtime (e.g. subscription tier loaded from auth), always cast with `as` to the full union type rather than relying on TypeScript's value-based narrowing.

---

### LL-002: Next.js OpenGraph Type Validation is Strict

**Problem:** `type: 'music.musician'` in OpenGraph metadata causes a TS2322 error. Next.js only allows specific OG types from the spec.

**Solution:** Use `type: 'profile'` for band/artist pages. Valid types are: `profile`, `article`, `website`, `book`, `music.song`, `music.album`, `music.playlist`, `music.radio_station`, `video.*`.

**Lesson:** Always check Next.js `Metadata` types before using OpenGraph `type` — not all schema.org types are supported.

---

### LL-003: Domain Exports Must Be Verified Before Use

**Problem:** Referenced `CATEGORIES` export from `@/domain/categories` which doesn't exist. The actual export is `CATEGORY_DEFINITIONS` (a Record keyed by category ID).

**Solution:** Use `Object.entries(CATEGORY_DEFINITIONS).map(([id, meta]) => [id, meta.name])` to build a category name map.

**Lesson:** Always verify export names by checking the source file before using them in new code. The `search_code_subagent` or a quick `grep -n "^export"` on the target file prevents this type of error.

---

### LL-004: Pre-existing Prisma TypeScript Errors Should Be Ignored

**Problem:** Prisma generates types that depend on the database schema being compiled. In this repo, `PrismaClient` is not exported from `@prisma/client` because the Prisma client hasn't been generated. This causes ~7 pre-existing TS errors in repository files.

**Solution:** These errors are pre-existing and unrelated to new code. Filter them with `grep -v "src/infrastructure/repositories\|src/lib/prisma.ts"` when checking for new errors.

**Lesson:** Always baseline TS errors before starting a feature. New errors introduced by your changes are your responsibility; pre-existing errors in infrastructure code are not.

---

### LL-005: GDPR Anonymisation vs Deletion

**Problem:** Simply deleting all user data would corrupt historical chart results — chart rankings would change retroactively if votes are deleted.

**Solution:** Fan votes are *anonymised* (userId set to NULL) rather than deleted. Vote weights are preserved but unlinked from the individual. This is compliant with GDPR Recital 26: anonymised data is exempt from GDPR.

**Lesson:** In systems where user-generated data affects aggregate results (charts, rankings, statistics), GDPR "right to erasure" must be implemented as anonymisation, not deletion. Always consider data integrity implications before implementing deletion.

---

### LL-006: RSS Feed Generation Without External Libraries

**Problem:** Using `rss` or `feed` npm packages adds bundle weight and a dependency to maintain.

**Solution:** Generate RSS XML as a template string using a simple `escapeXml()` helper. RSS 2.0 is simple enough that manual generation is maintainable and has zero dependencies.

**Lesson:** For well-defined, stable formats like RSS 2.0 or robots.txt, manual template generation is often simpler and safer than adding a dependency.

---

## Phase 3 (Previously documented)

### LL-P3-001: Prisma Cast Pattern for New Models

When adding new Prisma models after initial client generation, use the `(prisma as unknown as { modelName: { method } })` cast pattern. This is a workaround for the missing generated types until Prisma client is regenerated.

### LL-P3-002: API Route Dynamic Segments in Next.js 15

In Next.js 15, `params` in route handlers are `Promise<{ ... }>` and must be awaited. Use `const { id } = await params` not `const { id } = params`.

---

## Phase 1–2 (Summary)

- Removing peer voting from combined.ts required updating all 13 CategoryMetadata definitions to remove `peerWeight` and ensure `fanWeight + djWeight = 1.0`.
- The Schulze method implementation is O(n³) — acceptable for ≤100 nominees but must not be called on every request. Always compute on cron/admin trigger, never on read.
