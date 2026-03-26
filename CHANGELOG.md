# Changelog

All notable changes to darkTunes Charts are documented here.
This project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- **Documentation Suite**: Complete bilingual documentation set for all platform areas:
  - `QUICKSTART.md` — Bilingual (DE/EN) quick start guide with installation, commands, demo accounts, and deployment steps
  - `docs/HANDBUCH_DE.md` — Vollständiges Benutzerhandbuch (14 Kapitel, Deutsch)
  - `docs/MANUAL_EN.md` — Complete user manual (14 chapters, English)
  - `.env.example` — All environment variables documented with descriptions, registration links, and Vercel CLI setup instructions
- **Domain Layer** (`src/domain/`): Clean Architecture domain layer introduced per ADR-008. All voting business logic (Quadratic Voting, Schulze Beatpath, clique detection, tier classification, audit trail, AI prediction) moved to `src/domain/voting/` sub-modules. Category definitions and eligibility logic moved to `src/domain/categories/`. Zero React/network dependencies in the domain layer.
- **Infrastructure Layer** (`src/infrastructure/api/`): External API adapters for iTunes Search API and Odesli (song.link) API extracted to proper infrastructure layer, isolating network I/O from domain business logic.
- **`prefers-reduced-motion` CSS** (`src/index.css`): WCAG 2.1 SC 2.3.3 compliance — all CSS animations and transitions are suppressed for users who have enabled the OS-level "Reduce Motion" accessibility setting. Satisfies DIN EN ISO 9241-110 Fehlertoleranz requirement (ADR-009).
- **TSDoc/JSDoc documentation**: All exported domain functions now carry complete TSDoc comments explaining the `why` (edge cases, research basis, algorithmic rationale) in addition to the `what`.
- **ARCHITECTURE.md**: ADR-008 (domain layer) and ADR-009 (reduced motion) added.

### Changed
- **`vercel-deploy.sh`**: Fully rewritten with colored terminal output, ASCII banner, automatic Vercel CLI installation if missing, Node.js version check, step-by-step progress display, post-deploy next-steps summary.
- **`README.md`**: Complete rewrite — full repository structure, all environment variables, API reference, demo accounts, documentation table, and links to bilingual manuals.
- `src/lib/voting.ts`, `src/lib/schulze.ts`, `src/lib/votingAudit.ts`, `src/lib/aiPrediction.ts`: Converted from implementations to backward-compatibility re-export shims pointing to the new domain layer. All existing imports and tests continue to work without changes.

### Vercel Migration (previous entries)
- **Vercel Migration**: Removed all GitHub Spark platform dependencies; app now runs as a pure Vercel deployment
- **vercel.json**: Added `functions` configuration (`api/**/*.ts: nodejs22.x`) for Vercel Serverless Functions (ADR-006, ADR-007)
- **CHANGELOG.md**: Vercel migration entry documenting platform transition

### Changed
- **theme.css**: `#spark-app` → `#root` CSS selector fix so all CSS custom properties apply correctly on Vercel
- **ErrorFallback.tsx**: Removed Spark-specific error text; replaced with neutral "A runtime error occurred" message
- **ConsentBanner.tsx**: Removed "Spark KV store" reference from JSDoc comment
- **kv-shim.ts**: Cleaned up JSDoc — removed Spark-specific references; hook is now described as a localStorage-backed `useState`-compatible hook
- **ARCHITECTURE.md**: Updated ADR-005 to remove Spark references and clarify that all proprietary platform dependencies have been removed
- **SECURITY.md**: Replaced generic GitHub security template with project-specific policy
- **vercel.json**: Added `functions` configuration (`api/**/*.ts: nodejs22.x`) for Vercel Serverless Functions (ADR-006, ADR-007)
- **CHANGELOG.md**: Vercel migration entry documenting platform transition

### Changed
- **theme.css**: `#spark-app` → `#root` CSS selector fix so all CSS custom properties apply correctly on Vercel
- **ErrorFallback.tsx**: Removed Spark-specific error text; replaced with neutral "A runtime error occurred" message
- **ConsentBanner.tsx**: Removed "Spark KV store" reference from JSDoc comment
- **kv-shim.ts**: Cleaned up JSDoc — removed Spark-specific references; hook is now described as a localStorage-backed `useState`-compatible hook
- **ARCHITECTURE.md**: Updated ADR-005 to remove Spark references and clarify that all proprietary platform dependencies have been removed
- **SECURITY.md**: Replaced generic GitHub security template with project-specific policy

### Removed
- `.spark-initial-sha` — Spark-internal commit tracker, not needed for Vercel
- `spark.meta.json` — Spark metadata file
- `runtime.config.json` — Spark app-ID config file
- `src/features/dj-vote` — Stale artifact (duplicate of `src/features/dj-voting/DJVoteView.tsx`)

---

### Added (earlier, pre-migration)
- **ChartsView**: Real fan vote data integration — fan credits sourced from KV store instead of seeded placeholders
- **FanVoteView**: Genre filter tabs (All / Goth / Metal / Dark Electro) and tier badge next to each track
- **FanVoteView**: "Reset All Votes" button to clear all vote allocations
- **CategoriesView**: Real fan credit totals displayed per track; full scrollable nominees list
- **ARDashboardView**: Recharts `BarChart` for tier distribution visualisation
- **ARDashboardView**: Export Report button (placeholder for CSV/PDF export)
- **AIScoutView**: Integrated `generateAIPrediction` from `voting.ts` for real algorithmic confidence scores
- **TransparencyLog**: Global log view (all entries, not just current user's) with search/filter by track, band, or vote type
- **ErrorBoundary**: `ErrorBoundary` + `ErrorFallbackCard` components wrapping each view for graceful error recovery
- **App.tsx**: `useRef` guard on seeding `useEffect` to prevent double-seed in React Strict Mode
- **App.tsx**: `useCallback` on `handleVoteChange`, `handleSubmitVotes`, and `handleResetVotes`
- **App.tsx**: `createTransparencyLogEntry` called on vote submission to populate the audit log
- **votingAudit.ts**: UUID v4 for log and alert IDs (replaces `Date.now() + Math.random()` pattern)
- **voting.ts**: `applyCliqueWeighting` now applies `calculateCliqueCoefficient` instead of being a no-op
- **voting.ts**: `Array<number>(n).fill(0)` explicit generic for Schulze matrices
- **Vitest**: Test suite with `voting.test.ts`, `categories.test.ts`, and `seedData.test.ts`
- **ARCHITECTURE.md**: ADR-001 through ADR-005 documenting key design decisions

### Changed
- `seededRandom` consolidated into `src/lib/utils.ts` — local duplicates removed from ChartsView, CategoriesView, ARDashboardView, AIScoutView
- `TransparencyLog` no longer filters by `userId` by default — shows global log; `userId` prop is optional filter

### Fixed
- `ChartsView` previously ignored `fanVotes` prop; now correctly reads credits from KV state
- `CategoriesView` previously showed only 5 hardcoded entries; now shows all eligible tracks in a ScrollArea
