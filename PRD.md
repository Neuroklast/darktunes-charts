# darkTunes Charts - Fair, Transparent, Innovative

A democratic music charting platform for the dark music scene (Goth, Metal, Dark Electro) that breaks the pay-to-win model through quadratic voting, peer review, and transparent algorithms.

**Experience Qualities:**
1. **Empowering** - Fans and artists feel their voice genuinely matters through quadratic voting mechanics that prevent vote manipulation
2. **Trustworthy** - Complete transparency through public voting logs, Schulze method calculations, and anti-bot verification builds community confidence
3. **Discovery-Focused** - A&R dashboard and AI scout surface emerging talent before mainstream breakthrough, creating value for labels and fans alike

**Complexity Level:** Complex Application (advanced functionality with multiple views)
This platform requires sophisticated voting algorithms (quadratic voting, Schulze method), multi-stakeholder authentication (fans, DJs, bands, labels), real-time data dashboards, category-specific voting rules, tier-based filtering, and transparent audit logs.

## Essential Features

### 1. Multi-Category Chart System
- **Functionality:** Modular voting system across 4 category groups: Music Performance, Visuals & Haptics, Community & Spirit, Newcomer & Niche
- **Purpose:** Provides specialized recognition beyond pure streaming numbers, validating different aspects of artistry
- **Trigger:** User navigates to specific category (Track, Album, Best Vocalist, Grim Packaging, etc.)
- **Progression:** Select Category → View Nominees (filtered by tier/genre if applicable) → Cast Votes → View Results → Explore A&R Insights
- **Success criteria:** Each category displays appropriate nominees with tier restrictions applied (e.g., Underground Anthem shows only <10k listener bands)

### 2. Three-Pillar Voting System
- **Functionality:** Fan Voting (quadratic), DJ Choice (ranked), Bands Choice (peer review) with category-specific weighting
- **Purpose:** Balances popularity with technical merit and industry expertise
- **Trigger:** User selects voting mode based on their role (fan, verified DJ, band member)
- **Progression:** Authenticate Role → Allocate Credits/Ranks → Preview Impact → Submit → Receive Confirmation
- **Success criteria:** Vote weights correctly applied (e.g., Grim Packaging = 70% fan, Riff Architect = 60% peer review)

### 3. Quadratic Voting with Voice Credits
- **Functionality:** 100 voice credits per user per month, cost increases quadratically (1 vote = 1 credit, 2 votes = 4 credits, 10 votes = 100 credits)
- **Purpose:** Prevents wealthy manipulation while allowing passionate expression on key tracks
- **Trigger:** Fan clicks vote slider on any track/nominee
- **Progression:** Adjust Slider → See Credit Cost → Confirm → Credits Deducted → Vote Recorded
- **Success criteria:** Total credits never exceed 100, cost calculation visible in real-time

### 4. Tier-Based Fair Competition
- **Functionality:** Bands categorized into 4 tiers (Micro <1k, Emerging 1k-10k, Established 10k-100k, Macro 100k+) based on Spotify monthly listeners
- **Purpose:** Underground artists compete in protected categories without being drowned out by established acts
- **Trigger:** System automatically assigns tier based on Spotify API data
- **Progression:** Band Registers → API Fetches Listener Count → Tier Assigned → Eligible Categories Determined
- **Success criteria:** "Underground Anthem" category only shows Micro/Emerging tier bands

### 5. A&R High-Intent Dashboard
- **Functionality:** Label dashboard showing bands with high quadratic vote concentration (loyal fanbase indicators), merch success, and AI breakthrough predictions
- **Purpose:** Monetization through data-as-a-service for talent scouts seeking pre-viral artists
- **Trigger:** Label user accesses A&R section
- **Progression:** View High-Intent Signals → Filter by Synergies (e.g., Newcomer + High Merch) → Export Talent Report → Track Predictions
- **Success criteria:** Dashboard highlights bands receiving concentrated quadratic votes before streaming explosion

### 6. AI Newcomer Scout
- **Functionality:** Algorithmic predictions based on vote velocity, stream growth, and genre momentum
- **Purpose:** Surface breakthrough artists 3-6 months before mainstream recognition
- **Trigger:** User navigates to AI Scout tab
- **Progression:** View Confidence Scores → Analyze Signal Breakdown → Add to Watchlist → Track Over Time
- **Success criteria:** Confidence score above 70% correlates with tier-up within 3 months

### 7. Transparency & Anti-Bot System
- **Functionality:** Public voting logs, bot detection panel, Schulze method calculation display
- **Purpose:** Build trust through radical transparency and prevent manipulation
- **Trigger:** User clicks "Transparency Log" or system detects suspicious activity
- **Progression:** View Vote History → Inspect Patterns → Flag Anomalies → Admin Review → Potential Account Suspension
- **Success criteria:** All votes traceable, bot patterns detected with >90% accuracy

### 8. Regional Event & DJ Integration
- **Functionality:** Voting categories for DJs, Events (DE/AT/CH), Szene-Medien (blogs/podcasts)
- **Purpose:** Strengthen ecosystem around platform, create holistic scene representation
- **Trigger:** User navigates to "Ecosystem Module"
- **Progression:** Browse Nominees (DJs/Events/Media) → Vote with Quadratic Credits → View Rankings → Discover Events
- **Success criteria:** Event/DJ submissions integrated with location filters

## Edge Case Handling

- **Credit Overspend Protection** - UI prevents submission if voice credits exceed 100, shows real-time warning at 90%
- **Tier Boundary Changes** - If band crosses tier threshold mid-month, votes remain valid but future votes go to new tier
- **Duplicate Vote Prevention** - One vote per user per category per month, stored with timestamp and blockchain-style hash
- **Bot Detection Bypass Attempts** - CAPTCHA on suspicious patterns + manual review for accounts with VPN switching
- **Category-Specific Rules Conflict** - Each category config stored separately with explicit weight definitions
- **Spotify API Failure** - Cached tier data used with "Last Updated" timestamp, manual override for labels
- **Zero Nominees in Category** - Empty state with "Submit Your Entry" CTA and category explanation

## Design Direction

The design should evoke a **sophisticated underground music venue** – dark, immersive, and unapologetically bold. Think high-contrast visuals reminiscent of concert lighting cutting through darkness, with neon accents that suggest the energy of live performance. The interface should feel like a curated experience for serious music enthusiasts, not a mainstream pop platform. Typography should be aggressive yet readable, colors should be dramatic and moody, and interactions should have weight and intentionality.

## Color Selection

A dark, atmospheric palette with vibrant accent highlights that mirror stage lighting and dark subculture aesthetics.

- **Primary Color:** Deep Purple `oklch(0.35 0.15 300)` - Represents the mystique and artistry of dark music genres, sophisticated yet intense
- **Secondary Colors:** 
  - Dark Navy Base `oklch(0.10 0.005 270)` - Primary backgrounds, creates depth
  - Charcoal Card `oklch(0.15 0.01 270)` - Elevated surfaces
- **Accent Color:** Electric Cyan `oklch(0.75 0.15 200)` - Attention-grabbing for CTAs, votes, and breakthrough indicators
- **Destructive/Alert:** Deep Crimson `oklch(0.45 0.18 15)` - For tier-boundary alerts and critical actions

**Foreground/Background Pairings:**
- Background (Dark Navy `oklch(0.10 0.005 270)`): Light Grey text `oklch(0.95 0.01 270)` - Ratio 16.8:1 ✓
- Primary (Deep Purple `oklch(0.35 0.15 300)`): White text `oklch(0.98 0 0)` - Ratio 8.5:1 ✓
- Accent (Electric Cyan `oklch(0.75 0.15 200)`): Dark Navy text `oklch(0.10 0.005 270)` - Ratio 16.2:1 ✓
- Card (Charcoal `oklch(0.15 0.01 270)`): Light Grey text `oklch(0.98 0 0)` - Ratio 14.9:1 ✓

## Font Selection

Typography should convey **industrial strength and precision** while maintaining excellent readability for dense data displays. The combination should feel like professional music equipment interfaces – technical yet expressive.

- **Display/Headers:** Oswald (Bold/SemiBold) - Aggressive, condensed, perfect for category names and band names. Evokes concert posters and metal aesthetics.
- **Body Text:** Inter (Regular/Medium) - Clean, highly readable for voting interfaces and data displays
- **Monospace/Data:** JetBrains Mono - For vote counts, listener numbers, and confidence scores to emphasize precision

**Typographic Hierarchy:**
- H1 (Page Titles): Oswald Bold/32px/tight letter-spacing/-0.02em
- H2 (Section Headers): Oswald SemiBold/24px/normal letter-spacing
- H3 (Card Titles): Oswald SemiBold/20px/normal letter-spacing
- Body (Descriptions): Inter Regular/14px/line-height 1.6
- Labels (Form Fields): Inter Medium/12px/letter-spacing 0.02em/uppercase
- Data (Counts/Stats): JetBrains Mono Medium/14px/tabular-nums

## Animations

Animations should feel like **responsive stage lighting and audio equipment feedback** – immediate, purposeful, and slightly industrial. Use subtle physics-based movements that suggest weight and precision rather than playful bounce.

- **Vote Slider Interaction:** Smooth easing with slight resistance feel (cubic-bezier), credit counter animates with scale pulse
- **Category Transitions:** 300ms slide with fade, maintains spatial orientation
- **Chart Position Changes:** Staggered fade-in of entries (50ms delay each) with subtle vertical slide
- **Button Press Feedback:** 100ms scale-down to 0.97 with glow intensity increase
- **Credit Warning:** Gentle shake (5px horizontal) when approaching 100 credits
- **AI Confidence Bars:** Animated fill on load with 800ms duration, eased
- **Tier Badge Glow:** 2s pulse on breakthrough predictions

## Component Selection

**Components:**
- **Tabs** (shadcn) - For category navigation (Music, Visuals, Community, Newcomer), modified with thicker bottom border indicator
- **Card** (shadcn) - All content containers with glassmorphism effect (backdrop-blur + semi-transparent borders)
- **Slider** (shadcn) - Critical for quadratic voting interface, customized with credit cost display
- **Badge** (shadcn) - Tier indicators (Micro/Emerging/Established/Macro) with color-coded variants
- **Progress** (shadcn) - AI confidence scores, credit usage, listener count visualizations
- **Dialog** (shadcn) - Vote submission confirmation, transparency log detail views
- **Table** (shadcn) - A&R dashboard data displays, sortable columns for listener counts
- **Separator** (shadcn) - Visual division between voting categories
- **Accordion** (shadcn) - Expanded category descriptions, voting methodology explanations

**Customizations:**
- **QuadraticVotingSlider** (custom) - Displays vote count, credit cost, and remaining budget in real-time
- **TierBadge** (custom) - Color-coded with listener count thresholds and glow effects for high-performers
- **TransparencyLog** (custom) - Scrollable audit trail with timestamp, user hash, and vote details
- **BotDetectionPanel** (custom) - Admin-facing with pattern visualization and confidence scores
- **CategoryPricing** (custom) - Displays category-specific vote weighting (Fan 70% vs Peer 60%)

**States:**
- Buttons: Default (solid with subtle glow) → Hover (glow intensifies, scale 1.02) → Active (scale 0.97, glow peak) → Disabled (40% opacity, no glow)
- Inputs: Default (border accent) → Focus (accent ring + slight scale) → Error (destructive border + shake) → Success (accent border + checkmark)
- Sliders: Default (muted track) → Hover (accent track hint) → Dragging (full accent with glow trail)
- Cards: Default (glassmorphism) → Hover (border brightens, slight backdrop blur increase) → Selected (accent border)

**Icon Selection:**
- ChartLineUp (primary charts view)
- Heart (fan voting)
- Disc (DJ choice)
- UsersThree (peer/band voting)
- Robot (AI scout)
- Eye (transparency log)
- Shield (bot detection)
- Package (grim packaging category)
- Microphone (vocalist awards)
- GuitarPick (riff architect)
- FileVideo (shadow cinema)
- TShirt (merch of the month)

**Spacing:**
- Page Container: px-6 py-8
- Card Internal: p-6
- Card Gap: space-y-6
- Grid Gaps: gap-4 (cards), gap-6 (sections)
- Button Groups: gap-2
- Inline Elements: gap-3

**Mobile:**
- Header: Collapse navigation to hamburger menu, priority to Charts + Vote buttons
- Category Tabs: Horizontal scroll with snap-scroll behavior
- Voting Interface: Stack credit display above slider, full-width cards
- A&R Dashboard: Tables convert to stacked cards with key metrics only
- Charts: Single column, reduce stat display to essentials (hide secondary metrics)
