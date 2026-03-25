# Changelog

All notable changes to darkTunes Charts are documented here.
This project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
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
