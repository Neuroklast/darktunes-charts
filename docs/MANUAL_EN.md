# darkTunes Charts — User Manual (English)

**Version 1.0 · March 2026**

---

## Table of Contents

1. [About darkTunes Charts](#1-about-darktunes-charts)
2. [Getting Started](#2-getting-started)
3. [User Roles & Permissions](#3-user-roles--permissions)
4. [Fan Dashboard: Quadratic Voting](#4-fan-dashboard-quadratic-voting)
5. [DJ Dashboard: Schulze Method](#5-dj-dashboard-schulze-method)
6. [Band Dashboard: Peer Review & Tier System](#6-band-dashboard-peer-review--tier-system)
7. [Charts & Categories](#7-charts--categories)
8. [A&R Dashboard](#8-ar-dashboard)
9. [AI Newcomer Scout](#9-ai-newcomer-scout)
10. [Transparency & Anti-Bot System](#10-transparency--anti-bot-system)
11. [Privacy & Legal](#11-privacy--legal)
12. [Deployment & Operations](#12-deployment--operations)
13. [API Reference](#13-api-reference)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. About darkTunes Charts

darkTunes Charts is a **democratic music chart platform** for the dark music scene (Goth, Metal, Dark Electro). Unlike traditional pay-to-win chart systems, darkTunes uses a three-pillar voting architecture:

| Pillar | Method | Weight in Combined Score |
|---|---|---|
| **Fans (People's Choice)** | Quadratic Voting (100 credits/month) | 33.3% |
| **DJs (Curators)** | Schulze Method (Ranked-Choice Condorcet) | 33.3% |
| **Bands (Peer Review)** | Clique-weighted network model | 33.3% |

**Core Principles:**
- **Zero advertising** — The platform is completely ad-free
- **Financial contributions have zero influence on rankings** — Money only unlocks category access, not positions
- **Full transparency** — All votes are publicly auditable in the Transparency Log
- **Anti-manipulation** — Three independent security systems (bot detection, clique detection, rate limiting)

---

## 2. Getting Started

### 2.1 Create an Account

1. Click **"Sign In"** in the top navigation
2. Select the **"Create Account"** tab
3. Choose your role (Fan, Band, DJ, Editor)
4. Fill in all required fields
5. Click **"Create Account"**

> **Note for DJs:** DJ accounts require manual KYC verification by the darkTunes team. You will receive an email once your account is activated.

### 2.2 Navigation

The main navigation contains the following sections:

| Icon | Section | Description |
|---|---|---|
| 📊 | Charts | Current monthly charts across all categories |
| ❤️ | Fan Voting | Quadratic Voting interface |
| 🎵 | DJ Voting | Ranked-Choice Schulze Ballot |
| 📋 | Categories | All categories & pricing |
| 🤖 | AI Scout | AI breakthrough predictions |
| 📈 | A&R | Label dashboard for talent scouts |
| 🔍 | Transparency | Public voting audit log |
| 🛡️ | Bot Protection | Anti-manipulation dashboard |

### 2.3 Demo Access

The following demo accounts are available for testing (password: `demo1234`):

```
admin@darktunes.com  — Admin full access
dj@darktunes.com     — Verified DJ
band@darktunes.com   — Band account (CZARINA)
editor@darktunes.com — Editor
fan@darktunes.com    — Standard fan
```

---

## 3. User Roles & Permissions

### 3.1 Fan

- Receives **100 Voice Credits** per calendar month
- Can vote for all nominated tracks (Quadratic Voting)
- Can adjust, pause, and reset voting until submission
- Sees own voting history in the Transparency Log

**Registration requirement:** Email verification (OAuth: Spotify, Apple, Google, Discord planned)

### 3.2 DJ / Curator

- Can create complete preference rankings for all nominated tracks
- Vote is weighted via the **Schulze Method** (Beatpath algorithm)
- **Must be manually verified by the darkTunes team** (KYC process)
- KYC evidence: active club residencies, web radio activities, or festival bookings

**KYC Process:**
1. Register as a DJ
2. Email proof documents to: `kyc@darktunes.com`
3. Manual review by admin (typically 2–5 business days)
4. Activation email with DJ badge

### 3.3 Band / Artist

- Can **submit tracks** for chart categories
- First category per month is **free** (freemium model)
- Additional categories priced by tier (see [Tier System](#tier-system))
- Can vote for **other bands** in peer review (not self-voting)
- Receives DJ feedback on submitted tracks

**Registration requirement:** OAuth + background check for authorship verification

### 3.4 Editor

- Can write spotlights and articles
- Can submit nominations for special categories
- Access by **invitation only** from the darkTunes team

### 3.5 Admin

- Full system access
- KYC verification for DJs
- Bot alert review
- User management

### 3.6 A&R (Label)

- Access to specialized A&R dashboard
- Sees quadratic vote concentrations as signals for loyal fan bases
- Can export talent reports
- Data access via digital mandate (Power of Attorney via RLS)

---

## 4. Fan Dashboard: Quadratic Voting

### 4.1 What is Quadratic Voting?

Quadratic Voting (QV) is a scientific voting mechanism that accounts for **intensity of preference**. The cost model:

```
Cost = Votes²
```

| Votes | Cost in Credits |
|---|---|
| 1 | 1 |
| 2 | 4 |
| 3 | 9 |
| 5 | 25 |
| 10 | 100 (entire monthly budget) |

**Why is this fair?**
- Prevents "Tyranny of the Majority" — raw follower numbers no longer dominate
- Small, passionate fan bases can provide focused support
- Fans are incentivized to distribute credits across multiple acts
- Bot farms lose effectiveness quadratically

### 4.2 How Fan Voting Works

1. **Navigate** to "Fan Voting" (heart icon)
2. **Filter** by genre (All / Goth / Metal / Dark Electro)
3. **Move the slider** for your desired track — the budget display updates in real time
4. **Check** your remaining credits (top right of section)
5. **Click "Submit Votes"** — confirmation dialog appears
6. Optional: **"Reset All"** to start over

**Budget Management:**
- The budget always shows remaining credits
- At 90% usage, a warning appears
- Form cannot be submitted if budget is exceeded
- Credits reset on the 1st of each month

### 4.3 Voting Transparency

Each submitted vote appears in the Transparency Log with:
- Anonymized user ID (hash)
- Timestamp
- Number of votes
- Credits spent
- Applied weight (1.0 = full credit)

---

## 5. DJ Dashboard: Schulze Method

### 5.1 What is the Schulze Method?

The Schulze Method (also: Beatpath Method) is a **Condorcet-compatible ranked-choice procedure**. It finds the candidate that wins in **pairwise comparisons** against all others.

**Algorithmic Steps:**
1. Build pairwise preference matrix
2. Calculate strongest paths via Floyd-Warshall algorithm (O(n³))
3. Track with strongest beatpath against all = winner

**Why not Borda Count?** Borda Count is vulnerable to strategic downvoting and the spoiler effect. The Schulze Method completely eliminates tactical voting.

### 5.2 How DJ Voting Works

> **Prerequisite:** Verified DJ account (KYC completed)

1. **Navigate** to "DJ Voting" (disc icon)
2. **Drag and drop** tracks into your preferred order
3. Track 1 = strongest preference
4. **Click "Submit Ballot"**
5. The system immediately calculates the Schulze result and displays the pairwise matrix

**Visibility:**
- The current Schulze ranking is visible after submission
- The full pairwise matrix and strongest-path matrix are viewable in the Transparency Log

---

## 6. Band Dashboard: Peer Review & Tier System

### 6.1 Tier System

Bands are automatically classified based on their **Spotify Monthly Listeners**:

| Tier | Spotify Listeners | First Category | Additional Categories |
|---|---|---|---|
| **Micro** (Underground) | 0 – 10,000 | Free | €5/month |
| **Emerging** (Small) | 10,001 – 50,000 | Free | €15/month |
| **Established** (Medium) | 50,001 – 250,000 | Free | €35/month |
| **International** (Large) | 250,001 – 1,000,000 | Free | €75/month |
| **Macro** (Crossover) | > 1,000,000 | Free | €150/month |

> **Important:** Financial contributions have **zero** influence on ranking algorithms. Payments only unlock participation in additional categories.

### 6.2 Category Submission

1. **Open** "Categories" (list icon)
2. **Select** your category/categories — first one is free
3. **Calculate** total costs using the built-in calculator
4. **Submit** your track for each selected category

### 6.3 Peer Review Voting

1. **Navigate** to a voting section with band options
2. **Rate** other bands (not your own band)
3. The system automatically calculates the **clique coefficient**

**Anti-Collusion Algorithm:**
- Mutual voting (A→B and B→A) is automatically downweighted
- The more shared connections in a voting ring, the stronger the penalty
- Weight multiplier: 1.0 (clean) to 0.4 (strong collusion detected)

### 6.4 Chart Placement History

In your band dashboard you can see:
- Current placement in each registered category
- Historical placements (monthly)
- DJ feedback summary
- Voter structure analysis (how many fans, DJs, peers)

---

## 7. Charts & Categories

### 7.1 Category Groups

| Group | Categories |
|---|---|
| **Music Performance** | Track of the Month, Album of the Month, Voice of the Void, Riff Architect, Synthesis & Steel |
| **Visuals & Aesthetics** | Best Cover Art, Best Merch, Best Music Video |
| **Community & Spirit** | Chronicler of the Night, Dark Integrity Award, Lyricist of the Shadows |
| **Newcomer & Niche** | Underground Anthem (max. 10k listeners), The Dark Concept |

### 7.2 Per-Category Weights

Each category has its own weights for the three voting pillars:

| Category | Fan | DJ | Peer |
|---|---|---|---|
| Track of the Month | 40% | 30% | 30% |
| Voice of the Void | 20% | 20% | 60% |
| Best Cover Art | 70% | 15% | 15% |
| Underground Anthem | 50% | 25% | 25% |

### 7.3 Combined Charts

The combined score is calculated as:
```
Combined = (Fan Score × Fan Weight) + (DJ Score × DJ Weight) + (Peer Score × Peer Weight)
```

Track order on the homepage is **randomly randomized** (no order bias).

### 7.4 Special Categories & Special Awards

The Charts page also displays:
- **Band of the Day** — Deterministically selected daily at 00:00 UTC (Micro/Emerging tier only)
- **Special Awards** — "Label of the Month", "Most Dedicated Fan Base" etc.

---

## 8. A&R Dashboard

The A&R dashboard is designed for label representatives and talent scouts.

### 8.1 High-Intent Signals

The dashboard shows bands with **high quadratic vote concentration** — an indicator of loyal super-listeners before a band goes mainstream.

### 8.2 Tier Distribution

A bar chart visualizes the tier distribution of all registered bands.

### 8.3 Top Bands by Credits

Ranking of bands by total fan credits received — a stronger signal than raw vote counts, since high credits require genuine passion.

### 8.4 Export

The "Export Report" button creates a CSV report of all displayed data for external analysis.

---

## 9. AI Newcomer Scout

### 9.1 How the AI Scout Works

The AI Scout analyzes three signals for each band:

| Signal | Weight | Description |
|---|---|---|
| **Vote Velocity** | 40% | Rate of fan vote increase over the past 30 days |
| **Stream Growth** | 40% | Percentage growth in Spotify listeners |
| **Genre Momentum** | 20% | Performance relative to genre average |

**Confidence Score > 65%** = Band is predicted to tier-up within 3 months.

### 9.2 Interpretation

- **Green "Breakthrough Likely" badge** — High probability of viral breakthrough
- **Vote Velocity** shows the most actively growing fan base right now
- **Stream Growth** measures absolute listener growth
- **Genre Momentum** shows whether the band is riding its genre's zeitgeist

---

## 10. Transparency & Anti-Bot System

### 10.1 Transparency Log

Every vote is logged with the following data:
- **Audit ID** (UUID v4)
- **Timestamp**
- **Track ID**
- **Anonymized user ID** (hash, no PII)
- **Vote type** (fan / dj / peer)
- **Raw votes**
- **Credits spent** (fan votes only)
- **Applied weight** (1.0 = clean, < 1.0 = penalty)
- **Final contribution** (raw votes × weight)

The log is publicly accessible at: `GET /api/transparency`

### 10.2 Bot Detection System

The system automatically detects suspicious patterns:

**Trigger:** ≥ 100 votes within 60 seconds

**Severity Levels:**
- **Low** — Elevated volume, no further anomalies
- **Medium** — New accounts (< 7 days old) > 50% or IP cluster
- **High** — New accounts > 70% AND IP cluster

**What happens:**
1. Suspicious votes are automatically moved to **quarantine**
2. Alert appears in the Bot Detection panel
3. Admin manually reviews and approves/dismisses

### 10.3 Anti-Collusion Peer Review

For band peer review, the **clique coefficient** is calculated:

1. **Detect reciprocal voting**: Does band A vote for B and B vote for A?
2. **Count shared connections**: How many bands do both vote for?
3. **Calculate penalty**: -15% per shared connection, max -60%
4. **Minimum weight**: 0.4 (40% — never completely ignored)

---

## 11. Privacy & Legal

### 11.1 GDPR Compliance

- All personal data is only stored with explicit consent
- No third-party tracking
- Right to data deletion (in user profile under "Privacy")
- Cookies: only necessary session cookies

### 11.2 Voting Anonymization

- Votes are stored with an anonymized user hash
- The link between hash and real identity is held only by the user
- Admins cannot associate individual votes with individuals

### 11.3 Legal Documents

- [Imprint](/#impressum)
- [Privacy Policy](/#privacy)
- [Terms of Service](/#terms)

---

## 12. Deployment & Operations

### 12.1 Prerequisites

- Node.js ≥ 20
- npm ≥ 9
- Vercel account
- Vercel CLI: `npm install -g vercel`

### 12.2 Deploy Script

```bash
# Production deployment
./vercel-deploy.sh

# Preview deployment (for testing)
./vercel-deploy.sh --preview
```

The script automatically runs:
1. Install dependencies (`npm ci`)
2. TypeScript check (`tsc --noEmit`)
3. Tests (`npm test`)
4. Production build (`npm run build`)
5. Vercel deployment

### 12.3 Environment Variables

All environment variables are documented in [`.env.example`](../.env.example).

Key variables for production:

| Variable | Purpose |
|---|---|
| `SPOTIFY_CLIENT_ID` | Spotify API for listener data |
| `SPOTIFY_CLIENT_SECRET` | Spotify API authentication |
| `EXCHANGE_RATE_API_KEY` | Currency conversion (optional) |

### 12.4 In-Memory Store vs. Persistent Database

The default deployment uses an **in-memory store** (api/_lib/store.ts) that reinitializes from seed data on every cold start.

**For production with persistent data**, recommended options:
- Vercel KV (Redis) — easiest option
- Neon PostgreSQL + Prisma — for relational queries
- Supabase — for RLS and Auth integration

### 12.5 Monitoring

Recommended monitoring stack:
- **Vercel Analytics** — Web Vitals, Performance
- **Vercel Logs** — Serverless Function Logs
- **Sentry** (optional) — Error tracking

---

## 13. API Reference

All API endpoints are available under `/api/`.

### 13.1 Authentication

Currently: No API authentication (MVP). Production deployment should add JWT Bearer token.

### 13.2 Endpoints

#### Bands

```
GET  /api/bands              — List all registered bands
POST /api/bands              — Register new band
```

**POST /api/bands Body:**
```json
{
  "name": "Crematory",
  "genre": "Goth",
  "spotifyMonthlyListeners": 450000,
  "spotifyUrl": "https://open.spotify.com/artist/...",
  "bandcampUrl": "https://crematory.bandcamp.com"
}
```

#### Tracks

```
GET  /api/tracks             — List all tracks
POST /api/tracks             — Submit new track
```

#### Charts

```
GET  /api/charts?limit=10    — Get chart ranking
```

#### Votes

```
GET  POST /api/votes/fan     — Fan votes (Quadratic Voting)
GET  POST /api/votes/dj      — DJ ballots (Schulze Method)
GET  POST /api/votes/peer    — Peer review votes
```

**POST /api/votes/fan Body:**
```json
{
  "userId": "user-abc123",
  "votes": [
    { "trackId": "track-1", "votes": 3, "creditsSpent": 9 },
    { "trackId": "track-2", "votes": 2, "creditsSpent": 4 }
  ]
}
```

#### Transparency & Security

```
GET  POST /api/transparency  — Transparency log
GET  PUT  /api/bot-detection — Bot detection alerts
GET       /api/categories    — Category definitions
GET       /api/ai-prediction?bandId=X — AI prediction
GET       /api/spotify?bandId=X       — Spotify data
```

---

## 14. Troubleshooting

### "Votes cannot be submitted"

**Cause:** Budget exceeded (> 100 credits)
**Solution:** Reduce votes or click "Reset All"

### "DJ access not available"

**Cause:** KYC not yet completed
**Solution:** Wait for email confirmation (2–5 business days)

### "Build fails"

```bash
# Check TypeScript errors
npx tsc --noEmit

# Reinstall dependencies
rm -rf node_modules && npm install

# Check tests in isolation
npm test
```

### "In-memory store loses data after reload"

**Cause:** Each cold start of a Vercel serverless instance reinitializes the store
**Solution:** Integrate Vercel KV (Redis) as persistent data storage

### "Spotify API returns no data"

**Cause:** `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` are not set
**Solution:** Set environment variables in Vercel (see `.env.example`)

---

*darkTunes Charts — Fair · Transparent · Innovative*
*© 2026 darkTunes. MIT License.*
