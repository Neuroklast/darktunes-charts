# ADR-004: Monetization Foundations

**Status:** Accepted  
**Date:** 2026-04-02  
**Deciders:** Raphael (Product Owner), Platform Team

---

## Context

darkTunes Charts is a community-driven ranking platform for dark music (Gothic, EBM, Darkwave,
Industrial, Neofolk). Based on label feedback and product discussions, three monetization pillars
were confirmed:

1. **Charts are unaffected by payment** — No chart position can be purchased. Rankings are computed
   exclusively from Fan Quadratic Votes (50 %) and verified DJ Ballots (50 %).
2. **Visibility is bookable** — Promotional placements ("Neu & Hot", genre-page banners) can be
   booked on a self-serve basis. These placements are clearly labelled as *Sponsored* and have
   zero influence on chart scores.
3. **Tools and workflows are purchasable** — Market intelligence dashboards, promo submission to DJ
   inboxes, and label roster management are subscription / pay-per-use features.

Additionally, the stakeholder conversation confirmed:
- A first-class **`label` RBAC role** is needed so record labels can manage a roster of bands.
- Sponsored placement bookings must be in **weekly units** (minimum 1 week = 7 days) aligned to
  Monday 00:00 UTC boundaries.

---

## Decision

### 1. Role Model Extension

A new `label` role is added to the platform RBAC model alongside the existing roles
(`fan`, `dj`, `band`, `curator`). The Prisma `UserRole` enum already contained `LABEL`; this ADR
formalises its domain-level semantics.

| Permission        | fan | dj | band | curator | label |
|-------------------|-----|----|------|---------|-------|
| vote:fan          | ✓   |    |      |         |       |
| vote:dj           |     | ✓  |      | ✓       |       |
| submit:release    |     |    | ✓    |         |       |
| curate:compilation|     |    |      | ✓       |       |
| nominate:band     | ✓   | ✓  |      | ✓       |       |
| manage:users      |     |    |      |         |       |
| view:analytics    |     | ✓  | ✓    | ✓       | ✓     |
| review:dj-application |  |    |      | ✓       |       |
| manage:roster     |     |    |      |         | ✓     |
| submit:promo      |     |    | ✓    |         | ✓     |
| book:ad-slot      |     |    |      |         | ✓     |

Labels **cannot** vote, nominate, or affect chart computation in any way.

### 2. Label Organisation Entity

A `Label` model (organisation) is distinct from the `LABEL` user role:

- A user with role `LABEL` must be a **member** of at least one `Label` organisation with
  `role = ADMIN` to perform management actions.
- `LabelMember` links users to label organisations with an `ADMIN | MEMBER` role.
- Bands are associated to a label via an optional `labelId` foreign key on the `Band` model.
  A single-label model is chosen for simplicity; if multi-label history is needed later, this
  can be migrated to a join table without breaking existing functionality.

### 3. Market Signal (Dark Market Index)

- External platform data (Spotify monthly listeners, YouTube view velocity, Bandcamp presence,
  web-radio plays) is imported into `MarketSnapshot` records.
- A composite index (0–100) is computed per band and per label roster.
- This data is **not** used in chart computation; it is surfaced only in Pro/Pro+ dashboards
  and label analytics.
- Web-radio data is import-only (no crawler); stations are imported via a JSON endpoint.

### 4. Promo Pool

- Bands and labels can submit releases to a `PromoSubmission` queue.
- DJs browse their inbox, mark tracks as played/passed, and optionally leave feedback.
- Promo submissions have no automatic impact on chart voting; they only enable discoverability.
- Labels can submit on behalf of roster bands.

### 5. Sponsored "Neu & Hot" Weekly Slots

- An `AdSlot` represents a weekly booking window for a specific placement type
  (e.g. `NEU_HOT`, `GENRE_PAGE`, `SIDEBAR`).
- An `AdBooking` is a confirmed reservation for one or more consecutive weekly slots.

**Week boundary definition:**
> A "week" starts on **Monday 00:00:00 UTC** and ends on **Sunday 23:59:59 UTC**.
> `startDate` of a booking must be aligned to the Monday 00:00:00 UTC boundary of the desired week.
> `endDate = startDate + 7 days × k` where `k ≥ 1` is the number of weeks booked.

This rule is enforced in the domain layer (`validateWeeklyBooking`) independent of the API layer,
so any future booking channel (admin panel, API) applies the same constraints.

**Booking flow:**
1. Client calls `POST /api/ad-slots/book` → creates an `AdBooking` with status `RESERVED`.
2. Client is redirected to a Stripe Checkout session.
3. Stripe webhook (`checkout.session.completed`) sets status to `ACTIVE`.
4. `GET /api/ad-slots/active` returns all `ACTIVE` bookings for public display.
5. Expired bookings are set to `EXPIRED` via a scheduled cron job (not included in this PR).

### 6. Non-Goals

- No changes to chart computation or scoring algorithm.
- No revenue share payouts or compilation sales (deferred to a later phase).
- No web-radio crawler (import-only via JSON endpoint).
- No Bandcamp official API integration (field accepted as self-reported data for now).

---

## Consequences

### Positive
- Clear separation between chart integrity (unaffected by money) and commercial features.
- Labels have a first-class role with appropriate permissions and an organisation model.
- Self-serve ad booking removes manual sales overhead.
- Weekly blocks are simple to implement, reason about, and audit.

### Negative / Trade-offs
- Single-label model for bands means switching labels requires a data migration.
- Weekly UTC Monday alignment may confuse users in timezones where the week starts on Sunday;
  this must be documented clearly in the UI.
- Stripe integration adds operational complexity (webhook reliability, idempotency).

### Risks
- Promo Pool must never appear to influence chart rankings; copy and UI must make this explicit.
- Ad placements must be labelled "Sponsored" (platform integrity and regulatory compliance).
