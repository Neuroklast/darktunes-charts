# darkTunes Music Charts Platform

A sophisticated dark music charts platform for the Goth, Metal, and Dark Electro scene, featuring an innovative tripartite voting system that democratically balances fan enthusiasm, expert curation, and peer recognition.

**Experience Qualities**:
1. **Immersive** - Deep, atmospheric dark design that feels native to the underground music scene without compromising usability
2. **Transparent** - Every vote, every calculation visible—building trust in a community wary of manipulation
3. **Empowering** - Fans, DJs, and bands each have meaningful voice through mathematically sophisticated voting mechanisms

**Complexity Level**: Complex Application (advanced functionality with multiple views)
This platform implements three distinct mathematical voting algorithms (Quadratic Voting, Schulze Method, Anti-clique weighted voting), real-time credit calculations, role-based authentication, embedded audio players, AI predictions, and a sophisticated A&R analytics dashboard. Multiple user types require distinct interfaces and data visualization approaches.

## Essential Features

### Band Directory & Profile Management
- **Functionality**: Searchable database of bands with genre classification, streaming metrics, and tier system
- **Purpose**: Central registry that feeds all voting systems and analytics
- **Trigger**: User navigates to "Bands" section or searches
- **Progression**: Browse/Search → Select Band → View Profile (stats, submissions, embeds) → Listen to tracks
- **Success criteria**: Bands can be filtered by genre/tier, profiles display accurate Spotify metrics and embedded players

### Tripartite Voting System - Fans (Quadratic Voting)
- **Functionality**: Fans allocate 100 voice credits across tracks with quadratically increasing costs
- **Purpose**: Prevents vote manipulation while amplifying genuine preference intensity
- **Trigger**: Fan navigates to "Vote" section during voting period
- **Progression**: View eligible tracks → Drag sliders to allocate votes → Watch credit consumption in real-time → Confirm votes → See transparency log
- **Success criteria**: Math validation (10 votes = 100 credits used), visual feedback shows quadratic curve, prevents over-allocation

### Tripartite Voting System - DJs (Ranked-Choice/Schulze)
- **Functionality**: Verified DJs rank tracks; Schulze method calculates Condorcet winner
- **Purpose**: Expert curation that considers preference intensity beyond simple ranking
- **Trigger**: Verified DJ account accesses "DJ Ballot"
- **Progression**: View track list → Drag to reorder preferences → Submit ranked ballot → View aggregated results
- **Success criteria**: Schulze algorithm correctly processes pairwise preferences, handles Condorcet paradoxes

### Tripartite Voting System - Bands (Peer Choice with Anti-clique)
- **Functionality**: Bands vote for peers with algorithmic detection of reciprocal voting patterns
- **Purpose**: Peer recognition that penalizes gaming through mutual back-scratching
- **Trigger**: Verified band account votes in "Peer Choice" category
- **Progression**: Vote for other bands → System calculates clique coefficient → Weighted vote recorded → View adjusted influence score
- **Success criteria**: Reciprocal voting clusters identified and down-weighted by 40-60%

### Submission System with Credits
- **Functionality**: Bands submit one track free monthly, additional categories require credits
- **Purpose**: Monetization model that keeps barrier low while preventing spam
- **Trigger**: Band account clicks "Submit Track"
- **Progression**: Upload track metadata → Select categories (first free, others cost credits) → Add Spotify/Bandcamp embed → Submit → Track enters next voting cycle
- **Success criteria**: Credit deduction accurate, submission enters appropriate voting pools

### Audio Integration (Spotify & Bandcamp Embeds)
- **Functionality**: Embedded players for each track with sticky bottom player
- **Purpose**: Users can evaluate music while browsing charts/voting
- **Trigger**: User clicks play on any track
- **Progression**: Click play → Track loads in sticky player → Continues playing during navigation → Switch tracks seamlessly
- **Success criteria**: Embeds load reliably, sticky player persists across route changes

### A&R Dashboard (High-Intent Analytics)
- **Functionality**: Label dashboard showing quadratic vote intensity, genre trends, tier progression
- **Purpose**: Identify breakout artists based on genuine fan engagement beyond vanity metrics
- **Trigger**: A&R/Label account accesses dashboard
- **Progression**: View overview → Filter by genre/date → Examine "high-intent" signals (quadratic spend concentration) → Export prospect lists → Compare against streaming data
- **Success criteria**: Visualizes correlation between fan vote intensity and tier progression, highlights statistical anomalies

### AI Newcomer Scout
- **Functionality**: ML predictions on which bands will "break through" based on voting patterns + Spotify growth
- **Purpose**: Algorithmic talent identification for labels and fans
- **Trigger**: Access "Scout" section or view band prediction score
- **Progression**: View ranked predictions → See contributing factors (vote velocity, genre momentum) → Track prediction accuracy over time → Explore recommended artists
- **Success criteria**: Predictions show statistical reasoning, accuracy improves with historical data

## Edge Case Handling

- **Voting Deadline Race Condition** - Lock votes 60 seconds before deadline with countdown warning
- **Embed Loading Failures** - Graceful fallback to track metadata with "Play on Platform" link
- **Credit Exhaustion Mid-Vote** - Real-time validation prevents submission, highlights exceeded tracks in red
- **DJ Incomplete Rankings** - Allow partial ballots, unranked tracks treated as tied-last
- **Clique Detection False Positives** - Admin review panel for bands to contest de-weighting
- **Spotify API Rate Limits** - Cache monthly listener data for 24 hours, stale data indicator
- **Zero-Vote Tracks** - Display "No votes yet" state encouragingly, not punitively
- **Mobile Slider Precision** - Touch-optimized sliders with haptic-like visual feedback on increment

## Design Direction

The design should evoke the aesthetic of underground music culture—atmospheric, unapologetically dark, with industrial precision—while maintaining the clarity and usability expected of modern data-driven platforms. Think "what if Spotify was designed by a gothic architecture firm": dramatic, structural, but ultimately functional. The interface must command respect from both artists and industry professionals while remaining accessible to fans on mobile devices in club lighting.

## Color Selection

The palette draws from the physical materiality of the scene: obsidian surfaces, amethyst stage lighting, and the blood-red glow of amplifier tubes.

- **Primary Color**: Deep Amethyst `oklch(0.35 0.15 300)` - Represents darkTunes brand authority, used for primary CTAs and focus states. Communicates mystique and premium positioning.
- **Secondary Colors**: 
  - Obsidian Gray `oklch(0.15 0.01 270)` - Main structural UI color, card backgrounds
  - Blood Rose `oklch(0.45 0.18 15)` - Urgent actions, destructive operations, warning states
- **Accent Color**: Electric Cyan `oklch(0.75 0.15 200)` - High-intent data highlights, AI predictions, active player state. Creates sharp contrast for data that demands attention.
- **Foreground/Background Pairings**: 
  - Background (Dark Anthracite `oklch(0.10 0.005 270)`): Pale Gray text `oklch(0.95 0.01 270)` - Ratio 17.2:1 ✓
  - Obsidian Cards `oklch(0.15 0.01 270)`: White text `oklch(0.98 0 0)` - Ratio 12.8:1 ✓
  - Amethyst Primary `oklch(0.35 0.15 300)`: White text `oklch(0.98 0 0)` - Ratio 8.1:1 ✓
  - Blood Rose `oklch(0.45 0.18 15)`: White text `oklch(0.98 0 0)` - Ratio 5.2:1 ✓
  - Electric Cyan Accent `oklch(0.75 0.15 200)`: Dark text `oklch(0.10 0.005 270)` - Ratio 14.1:1 ✓

## Font Selection

Typography must balance scene aesthetic (aggressive, architectural) with functional demands (dense data tables, mobile readability).

- **Typographic Hierarchy**: 
  - H1 (Section Titles): Oswald Bold/32px/tracking-tight - Strong, condensed display for "CHARTS", "VOTING", "A&R DASHBOARD"
  - H2 (Band Names): Oswald SemiBold/24px/tracking-normal - Prominent without overwhelming
  - H3 (Category Headers): Inter SemiBold/18px/tracking-wide - Clean separation
  - Body (Descriptions, Data): Inter Regular/16px/leading-relaxed - High legibility for dense information
  - Caption (Metadata, Timestamps): Inter Medium/14px/text-muted-foreground - Subdued secondary info
  - Data (Streaming Numbers): JetBrains Mono Medium/16px - Monospace for numerical alignment in tables

## Animations

Animations should feel like the mechanical precision of stage equipment—purposeful movements with weight, not frivolous flourishes. Every animation communicates system state or guides attention to critical data changes.

- **Micro-interactions**: Vote slider emits subtle glow pulse on value change (120ms), credit counter decrements with slight scale bounce (180ms)
- **State transitions**: Card hover elevates with 200ms ease-out + slight purple glow on border
- **Page transitions**: 300ms slide-fade between main views maintains spatial continuity
- **Data updates**: Streaming numbers and vote counts increment with staggered counter animation (400ms) when refreshed
- **Audio player**: Waveform visualization responds to playback, sticky player slides up from bottom (250ms) on track load
- **AI predictions**: Confidence score bars fill with gradient animation (600ms ease-in-out) on reveal

## Component Selection

- **Components**: 
  - **Card** (Obsidian variant) - Band profiles, track entries, dashboard widgets; add glassmorphism with `backdrop-blur-sm bg-obsidian/80`
  - **Slider** - Critical for quadratic voting interface; customize thumb to be larger (20px) with amethyst glow ring
  - **Tabs** - Genre switching (Goth/Metal/Dark Electro) in charts view
  - **Table** - A&R dashboard data grid; zebra striping with `hover:bg-obsidian/40`
  - **Dialog** - Track submission flow, voting confirmation modals
  - **Badge** - Tier indicators (Micro/Emerging/Established/Macro), genre tags
  - **Progress** - Credit consumption visualization, AI confidence scores
  - **Separator** - Dividers between voting sections
  - **Scroll-Area** - Long band lists, ranked-choice DJ ballot
  - **Avatar** - Band logos in compact list views
  - **Tooltip** - Explain quadratic voting math, clique weighting factors
  - **Sheet** - Mobile navigation drawer
  
- **Customizations**: 
  - **VotingSlider** - Custom component wrapping Slider with real-time credit calculation display, quadratic cost curve visualization
  - **StickyAudioPlayer** - Fixed bottom bar with Spotify/Bandcamp embed, track metadata, waveform viz
  - **RankedBallot** - Drag-drop list for DJ ranked-choice voting (use `cmdk` for keyboard nav)
  - **QuadraticMeter** - Circular progress showing 100 credit pool depletion
  - **CliqueCoefficientIndicator** - Visual weight representation for peer votes
  
- **States**: 
  - Buttons: Default amethyst, hover with cyan border glow, active with scale-95, disabled at 40% opacity
  - Inputs: Obsidian background, focus with cyan ring-2, error with blood-rose border
  - Sliders: Track in muted gray, fill in amethyst gradient, thumb with cyan glow on drag
  
- **Icon Selection**: 
  - Voting: `Heart` (fan votes), `Vinyl` (DJ choice), `UsersThree` (peer choice)
  - Audio: `Play`, `Pause`, `SpeakerHigh` for player controls
  - Navigation: `ChartLineUp` (charts), `UploadSimple` (submissions), `ChartBar` (A&R), `Robot` (AI Scout)
  - Actions: `Check` (vote confirmed), `Warning` (credit exceeded), `Star` (tier indicator)
  
- **Spacing**: 
  - Cards: `p-6` internal padding, `gap-4` between elements
  - Sections: `space-y-8` vertical rhythm
  - Grid layouts: `gap-6` for band grid, `gap-4` for dense data tables
  - Page margins: `px-6 md:px-12 lg:px-24` with `max-w-7xl mx-auto` constraint
  
- **Mobile**: 
  - Sidebar navigation collapses to bottom tab bar on `<768px`
  - Voting sliders increase touch target to 48px height
  - A&R dashboard tables switch to vertical card stack
  - Sticky audio player height reduces from 96px to 72px on mobile
  - Genre tabs scroll horizontally with snap-x on small screens
