# Architecture Decision Records

## ADR-001: Quadratic Voting for Fan Pillar

**Status:** Accepted

**Context:** Traditional 1-person-1-vote systems allow wealthy fans or coordinated groups to dominate charts unfairly.

**Decision:** Implement quadratic voting where casting N votes costs N² voice credits. Each fan receives 100 credits per monthly period.

**Consequences:** Fans must distribute credits across multiple artists to maximise influence, reducing whale dominance and rewarding genuine breadth of fandom.

---

## ADR-002: Schulze Method for DJ Pillar

**Status:** Accepted

**Context:** Simple plurality voting (most first-place votes wins) is vulnerable to strategic ballot-stuffing and vote-splitting.

**Decision:** Implement the Schulze (Beatpath) Condorcet method for DJ ranked-choice ballots. DJs submit full preference orderings; the winner is the candidate that defeats all others via the strongest beatpath.

**Consequences:** Eliminates strategic burial (a flaw in Borda count systems used by awards like Eurovision). Computationally O(n³) but acceptable for ≤100 nominees per category.

---

## ADR-003: Five-Tier Band Classification

**Status:** Accepted

**Context:** Established acts with millions of listeners should not compete directly against bedroom producers with 500 followers.

**Decision:** Classify bands into five tiers based on Spotify monthly listeners:
- **Micro** (Underground): 0 – 10,000
- **Emerging** (Small): 10,001 – 50,000
- **Established** (Medium): 50,001 – 250,000
- **International** (Large): 250,001 – 1,000,000
- **Macro** (Crossover): above 1,000,000

**Consequences:** Fair competition within tiers. Cross-subsidization model: Macro bands pay higher category fees (€150/category) which fund free participation for Micro bands (€5/category, first category always free).

---

## ADR-004: Clique Detection via Network Graph Analysis

**Status:** Accepted

**Context:** Peer voting pillar is vulnerable to vote-trading rings where bands agree to mutually vote each other up.

**Decision:** Calculate a clique coefficient for each peer vote based on the density of mutual voting connections in the band graph. Votes from tight cliques are down-weighted using `calculateCliqueCoefficient()`.

**Consequences:** Legitimate peer appreciation (bands genuinely recommending others) receives full weight. Coordinated vote rings receive weights as low as 0.4, reducing their chart impact by 60%.

---

## ADR-005: KV Store for Client-Side State Persistence

**Status:** Accepted

**Context:** The platform needs persistent state across page refreshes without a backend in the MVP phase.

**Decision:** Use `@github/spark`'s `useKV` hook for all persistent state (bands, tracks, fanVotes, transparency-log). KV keys follow a flat namespace convention (e.g., `'bands'`, `'fanVotes'`, `'transparency-log'`).

**Consequences:** Zero-backend MVP. State is per-user and not shared across sessions. Production deployment will replace `useKV` with API calls to a real backend while keeping the same hook interface via a compatibility shim.
