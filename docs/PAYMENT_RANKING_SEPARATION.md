# Payment–Ranking Separation Guarantee

> **Spec §3.2**: *"Financial contribution has ZERO influence on ranking scores."*

## Architectural Enforcement

The Darktunes Charts platform enforces a strict boundary between payment/pricing
logic and chart ranking logic. This separation is guaranteed at three levels:

### 1. Module Boundary

| Concern | Module Path | Purpose |
|---------|------------|---------|
| Ranking | `src/domain/voting/combined.ts` | `calculateCombinedScores`, `assignRanks` |
| Payment | `src/domain/payment/tierPricing.ts` | `calculateTierPrice`, tier constants |
| Stripe | `src/infrastructure/payment/stripeAdapter.ts` | Payment gateway adapter |

The scoring module (`combined.ts`) has **zero imports** from any payment module.
The `TrackScores` interface accepts only voting dimensions (`fanScore`, `djScore`,
`peerScore`) — there is no field for payment status, tier, or pricing.

### 2. Data Flow

```
Fan Votes ─┐
            ├─► calculateCombinedScores() ─► assignRanks() ─► Chart Position
DJ Votes  ─┤
            │
Peer Votes ┘

Tier Pricing ─► calculateTierPrice() ─► Category Access (participation only)
```

Payment data flows through an entirely separate pipeline. It determines which
categories a band can *enter*, but never influences the scores or ranks within
those categories.

### 3. Automated Test Suite

The test file `src/domain/__tests__/paymentRankingSeparation.test.ts` verifies
the separation with three independent strategies:

| Strategy | What It Catches |
|----------|----------------|
| **Behavioural** | Identical votes + different payment status → identical scores |
| **Static import analysis** | `combined.ts` has no imports from payment modules |
| **Tier pricing isolation** | Ranking output is independent of tier or pricing data |

These tests run in CI on every push and pull request alongside all other unit
tests via `vitest run`.

## Why This Matters

In a fair competition platform, bands must be ranked solely on artistic merit
as judged by fans, DJs, and peers. If payment data could leak into the scoring
pipeline — even accidentally — it would undermine the core fairness promise.
The automated tests act as a safety net: if a developer inadvertently imports
a payment module into the scoring code, CI will fail immediately.
