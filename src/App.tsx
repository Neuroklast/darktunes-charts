import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { 
  ChartLineUp, 
  Heart, 
  Disc, 
  UsersThree, 
  ChartBar, 
  Robot, 
  Eye, 
  Shield,
  List
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { CategorySelector } from '@/components/CategorySelector'
import { QuadraticVotingSlider } from '@/components/QuadraticVotingSlider'
import { TransparencyLog } from '@/components/TransparencyLog'
import { BotDetectionPanel } from '@/components/BotDetectionPanel'
import { CategoryPricing } from '@/components/CategoryPricing'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import type { Band, Track, FanVote, Genre, CategoryGroup, AllCategory } from '@/lib/types'
import { calculateQuadraticCost, validateFanVotes, getTierFromListeners } from '@/lib/voting'
import { canBandCompeteInCategory, getCategoryMetadata } from '@/lib/categories'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type View = 'charts' | 'categories' | 'fan-vote' | 'ar' | 'ai' | 'transparency' | 'bot-detection' | 'pricing'

function App() {
  const [bands] = useKV<Band[]>('bands', [])
  const [tracks] = useKV<Track[]>('tracks', [])
  const [fanVotes, setFanVotes] = useKV<Record<string, FanVote>>('fanVotes', {})
  const [currentView, setCurrentView] = useState<View>('charts')
  const [selectedCategoryGroup, setSelectedCategoryGroup] = useState<CategoryGroup>('music')
  const [selectedCategory, setSelectedCategory] = useState<string>('track')
  const [selectedGenre, setSelectedGenre] = useState<Genre>('Goth')

  const safeBands = bands || []
  const safeTracks = tracks || []
  const safeFanVotes = fanVotes || {}

  const TOTAL_CREDITS = 100
  const usedCredits = Object.values(safeFanVotes).reduce(
    (sum, vote) => sum + calculateQuadraticCost(vote.votes),
    0
  )
  const availableCredits = TOTAL_CREDITS - usedCredits

  const handleVoteChange = (trackId: string, votes: number) => {
    setFanVotes(current => {
      const updated = { ...(current || {}) }
      if (votes === 0) {
        delete updated[trackId]
      } else {
        updated[trackId] = {
          trackId,
          votes,
          creditsSpent: calculateQuadraticCost(votes)
        }
      }
      return updated
    })
  }

  const submitVotes = () => {
    const validation = validateFanVotes(Object.values(safeFanVotes))
    if (validation.valid) {
      toast.success('Votes submitted successfully!', {
        description: `${validation.totalCredits} credits spent`
      })
    } else {
      toast.error('Cannot submit votes', {
        description: 'Total credits exceed 100'
      })
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Micro': return 'text-muted-foreground'
      case 'Emerging': return 'text-accent'
      case 'Established': return 'text-primary'
      case 'Macro': return 'text-destructive'
      default: return 'text-muted-foreground'
    }
  }

  const getTierBadgeVariant = (tier: string): any => {
    switch (tier) {
      case 'Macro': return 'destructive'
      case 'Established': return 'default'
      case 'Emerging': return 'secondary'
      default: return 'outline'
    }
  }

  const filteredTracksForCategory = () => {
    if (selectedCategory === 'underground-anthem') {
      return safeTracks.filter(t => {
        const band = safeBands.find(b => b.id === t.bandId)
        return band && band.spotifyMonthlyListeners < 10000
      })
    }
    return safeTracks.filter(t => t.category === selectedGenre)
  }

  const getVotesForTrack = (trackId: string) => safeFanVotes[trackId]?.votes || 0

  return (
    <div className="min-h-screen bg-background gradient-mesh">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 glassmorphism">
        <div className="container max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Disc className="w-8 h-8 text-primary" weight="duotone" />
            <div>
              <h1 className="text-xl font-display font-bold tracking-tight">darkTunes CHARTS</h1>
              <p className="text-xs text-muted-foreground font-display tracking-wide">FAIR • TRANSPARENT • INNOVATIVE</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={currentView === 'charts' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('charts')}
              className="gap-2"
            >
              <ChartLineUp className="w-4 h-4" />
              <span className="hidden sm:inline">Charts</span>
            </Button>
            <Button
              variant={currentView === 'categories' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('categories')}
              className="gap-2"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Categories</span>
            </Button>
            <Button
              variant={currentView === 'fan-vote' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('fan-vote')}
              className="gap-2"
            >
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">Vote</span>
            </Button>
            <Button
              variant={currentView === 'ar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('ar')}
              className="gap-2"
            >
              <ChartBar className="w-4 h-4" />
              <span className="hidden sm:inline">A&R</span>
            </Button>
            <Button
              variant={currentView === 'ai' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('ai')}
              className="gap-2"
            >
              <Robot className="w-4 h-4" />
              <span className="hidden sm:inline">AI Scout</span>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button
              variant={currentView === 'transparency' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('transparency')}
              className="gap-2"
            >
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">Log</span>
            </Button>
            <Button
              variant={currentView === 'bot-detection' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('bot-detection')}
              className="gap-2"
            >
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Security</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-7xl mx-auto px-6 py-8">
        {currentView === 'charts' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-display font-bold tracking-tight mb-2">OVERALL CHARTS</h2>
              <p className="text-muted-foreground">Top tracks combining all three voting pillars (Fan, DJ, Peer)</p>
            </div>

            <div className="space-y-4">
              {safeTracks.slice(0, 10).map((track, idx) => {
                const band = safeBands.find(b => b.id === track.bandId)
                if (!band) return null

                return (
                  <Card key={track.id} className="p-6 glassmorphism hover:bg-card/60 transition-all">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className={cn(
                          "w-12 h-12 rounded-md bg-secondary flex items-center justify-center font-display font-bold text-xl",
                          idx < 3 && "glow-primary bg-primary/20"
                        )}>
                          {idx + 1}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <h3 className="font-display text-xl font-semibold">{track.title}</h3>
                            <p className="text-muted-foreground">{band.name}</p>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant={getTierBadgeVariant(band.tier)}>
                              {band.tier}
                            </Badge>
                            <Badge variant="outline">{band.genre}</Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                          <div className="text-center p-3 bg-secondary/50 rounded">
                            <Heart className="w-5 h-5 mx-auto mb-1 text-primary" />
                            <p className="text-xs text-muted-foreground">Fan Votes</p>
                            <p className="font-mono font-bold">
                              {Math.floor(Math.random() * 50 + idx * 10)}
                            </p>
                          </div>
                          <div className="text-center p-3 bg-secondary/50 rounded">
                            <Disc className="w-5 h-5 mx-auto mb-1 text-accent" />
                            <p className="text-xs text-muted-foreground">DJ Score</p>
                            <p className="font-mono font-bold">
                              {Math.floor(Math.random() * 30 + idx * 5)}
                            </p>
                          </div>
                          <div className="text-center p-3 bg-secondary/50 rounded">
                            <UsersThree className="w-5 h-5 mx-auto mb-1 text-destructive" />
                            <p className="text-xs text-muted-foreground">Peer Votes</p>
                            <p className="font-mono font-bold">
                              {Math.floor(Math.random() * 20 + idx * 3)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4">
                          <p className="text-xs text-muted-foreground mb-2">Monthly Listeners</p>
                          <div className="flex items-center gap-2">
                            <Progress value={(band.spotifyMonthlyListeners / 100000) * 100} className="flex-1" />
                            <span className="font-mono text-sm font-medium">
                              {band.spotifyMonthlyListeners.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {currentView === 'categories' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-display font-bold tracking-tight mb-2">CATEGORY VOTING</h2>
              <p className="text-muted-foreground">Specialized categories across Music, Visuals, Community, and Newcomer groups</p>
            </div>

            <CategorySelector
              selectedGroup={selectedCategoryGroup}
              selectedCategory={selectedCategory}
              onGroupChange={setSelectedCategoryGroup}
              onCategoryChange={setSelectedCategory}
            />

            <Card className="p-6 glassmorphism">
              <div className="mb-4">
                <h3 className="font-display text-xl font-semibold mb-2">
                  {getCategoryMetadata(selectedCategory as AllCategory).name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {getCategoryMetadata(selectedCategory as AllCategory).description}
                </p>
              </div>
              
              <div className="space-y-3">
                {filteredTracksForCategory().slice(0, 5).map((track) => {
                  const band = safeBands.find(b => b.id === track.bandId)
                  if (!band) return null
                  if (!canBandCompeteInCategory(selectedCategory as AllCategory, band.tier, band.spotifyMonthlyListeners)) {
                    return null
                  }

                  return (
                    <div key={track.id} className="p-4 bg-secondary/30 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{track.title}</p>
                          <p className="text-sm text-muted-foreground">{band.name} • {band.tier}</p>
                        </div>
                        <Badge variant="outline" className="font-mono">
                          {Math.floor(Math.random() * 100 + 20)} pts
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>
        )}

        {currentView === 'fan-vote' && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-3xl font-display font-bold tracking-tight mb-2">FAN VOTING</h2>
                <p className="text-muted-foreground">Quadratic voting - your voice credits increase quadratically</p>
              </div>
              <Card className="p-4 glassmorphism min-w-[200px]">
                <p className="text-xs text-muted-foreground mb-2">Voice Credits</p>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-3xl font-mono font-bold">{availableCredits}</span>
                  <span className="text-muted-foreground">/ 100</span>
                </div>
                <Progress value={usedCredits} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {usedCredits} credits spent
                </p>
              </Card>
            </div>

            <div className="space-y-4">
              {filteredTracksForCategory().map(track => {
                const band = safeBands.find(b => b.id === track.bandId)
                if (!band) return null

                return (
                  <Card key={track.id} className="p-6 glassmorphism">
                    <QuadraticVotingSlider
                      trackId={track.id}
                      trackTitle={track.title}
                      bandName={band.name}
                      maxVotes={10}
                      currentVotes={getVotesForTrack(track.id)}
                      availableCredits={availableCredits}
                      onVoteChange={handleVoteChange}
                    />
                  </Card>
                )
              })}
            </div>

            <Card className="p-6 glassmorphism bg-secondary/20">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display font-semibold text-lg mb-1">Vote Summary</h3>
                  <p className="text-sm text-muted-foreground">
                    {Object.keys(safeFanVotes).length} tracks selected
                  </p>
                </div>
                <Button
                  onClick={submitVotes}
                  disabled={usedCredits === 0 || usedCredits > 100}
                  className="gap-2"
                  size="lg"
                >
                  Submit Votes
                </Button>
              </div>
              <Separator className="my-4" />
              <div className="text-xs text-muted-foreground space-y-1">
                <p>💡 Tip: Vote costs increase quadratically</p>
                <p>• 1 vote = 1 credit | 2 votes = 4 credits | 3 votes = 9 credits</p>
                <p>• 5 votes = 25 credits | 10 votes = 100 credits</p>
              </div>
            </Card>
          </div>
        )}

        {currentView === 'ar' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-display font-bold tracking-tight mb-2">A&R DASHBOARD</h2>
              <p className="text-muted-foreground">High-intent data for talent scouts and labels</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-6 glassmorphism">
                <h3 className="text-sm text-muted-foreground mb-2">Total Bands</h3>
                <p className="text-3xl font-mono font-bold">{safeBands.length}</p>
              </Card>
              <Card className="p-6 glassmorphism">
                <h3 className="text-sm text-muted-foreground mb-2">Active Tracks</h3>
                <p className="text-3xl font-mono font-bold">{safeTracks.length}</p>
              </Card>
              <Card className="p-6 glassmorphism">
                <h3 className="text-sm text-muted-foreground mb-2">Total Votes Cast</h3>
                <p className="text-3xl font-mono font-bold">
                  {Object.values(safeFanVotes).reduce((sum, v) => sum + v.votes, 0)}
                </p>
              </Card>
            </div>

            <Card className="p-6 glassmorphism">
              <h3 className="font-display text-xl font-semibold mb-4">High-Intent Signals</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Bands receiving the most quadratic vote credits (genuine fan engagement)
              </p>
              <div className="space-y-4">
                {safeBands.slice(0, 5).map((band, idx) => (
                  <div key={band.id} className="flex items-center gap-4 p-4 bg-secondary/30 rounded-lg">
                    <div className="w-10 h-10 rounded bg-primary/20 flex items-center justify-center font-display font-bold">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{band.name}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{band.genre}</span>
                        <span>•</span>
                        <span className={cn("font-mono", getTierColor(band.tier))}>
                          {band.tier}
                        </span>
                        <span>•</span>
                        <span className="font-mono">
                          {band.spotifyMonthlyListeners.toLocaleString()} listeners
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline" className="gap-1">
                      <span className="text-accent font-mono font-bold">
                        {Math.floor(Math.random() * 200 + 50)}
                      </span>
                      credits
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 glassmorphism">
              <h3 className="font-display text-xl font-semibold mb-4">Synergy View</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Bands ranking high in multiple categories - prime signing targets
              </p>
              <div className="space-y-4">
                {safeBands.filter(b => b.tier === 'Emerging' || b.tier === 'Micro').slice(0, 3).map((band) => (
                  <div key={band.id} className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-display font-semibold text-lg">{band.name}</p>
                        <p className="text-sm text-muted-foreground">{band.genre} • {band.tier}</p>
                      </div>
                      <Badge className="bg-accent text-accent-foreground">HOT</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-2 bg-secondary/50 rounded">
                        <p className="text-xs text-muted-foreground">Underground</p>
                        <p className="font-mono font-bold text-sm">#2</p>
                      </div>
                      <div className="text-center p-2 bg-secondary/50 rounded">
                        <p className="text-xs text-muted-foreground">Merch</p>
                        <p className="font-mono font-bold text-sm">#5</p>
                      </div>
                      <div className="text-center p-2 bg-secondary/50 rounded">
                        <p className="text-xs text-muted-foreground">Fan Votes</p>
                        <p className="font-mono font-bold text-sm">↑ 45%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {currentView === 'ai' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-display font-bold tracking-tight mb-2 flex items-center gap-3">
                <Robot className="w-8 h-8 text-accent animate-glow-pulse" weight="duotone" />
                AI NEWCOMER SCOUT
              </h2>
              <p className="text-muted-foreground">
                Algorithmic predictions on which bands will break through next
              </p>
            </div>

            <Card className="p-6 glassmorphism">
              <div className="space-y-6">
                {safeBands.slice(0, 5).map((band, idx) => {
                  const confidence = 85 - idx * 7
                  const isPredictedBreakthrough = confidence > 70

                  return (
                    <div key={band.id} className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-display text-xl font-semibold">{band.name}</h3>
                          <p className="text-sm text-muted-foreground">{band.genre} • {band.tier}</p>
                        </div>
                        {isPredictedBreakthrough && (
                          <Badge variant="default" className="bg-accent text-accent-foreground gap-1">
                            <span className="w-2 h-2 bg-accent-foreground rounded-full animate-glow-pulse" />
                            Breakthrough Likely
                          </Badge>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-muted-foreground">Confidence Score</span>
                          <span className="text-sm font-mono font-bold text-accent">{confidence}%</span>
                        </div>
                        <Progress value={confidence} className="h-2" />
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center p-3 bg-secondary/50 rounded">
                          <p className="text-xs text-muted-foreground mb-1">Vote Velocity</p>
                          <p className="font-mono font-bold text-primary">
                            +{(8.5 - idx * 1.2).toFixed(1)}
                          </p>
                        </div>
                        <div className="text-center p-3 bg-secondary/50 rounded">
                          <p className="text-xs text-muted-foreground mb-1">Stream Growth</p>
                          <p className="font-mono font-bold text-accent">
                            +{(45 - idx * 5)}%
                          </p>
                        </div>
                        <div className="text-center p-3 bg-secondary/50 rounded">
                          <p className="text-xs text-muted-foreground mb-1">Genre Momentum</p>
                          <p className="font-mono font-bold text-destructive">
                            {(1.8 - idx * 0.2).toFixed(1)}x
                          </p>
                        </div>
                      </div>

                      {idx < safeBands.length - 1 && <Separator />}
                    </div>
                  )
                })}
              </div>
            </Card>

            <Card className="p-6 glassmorphism bg-secondary/20">
              <h3 className="font-display font-semibold mb-2">How It Works</h3>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  The AI Scout analyzes three key factors to predict breakthrough potential:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong className="text-foreground">Vote Velocity:</strong> Rate of fan vote increase over time</li>
                  <li><strong className="text-foreground">Stream Growth:</strong> Spotify listener growth percentage</li>
                  <li><strong className="text-foreground">Genre Momentum:</strong> Performance relative to genre average</li>
                </ul>
                <p className="mt-4">
                  Confidence scores above 70% indicate bands statistically likely to tier-up within 3 months.
                </p>
              </div>
            </Card>
          </div>
        )}

        {currentView === 'transparency' && (
          <TransparencyLog userId="current-user" />
        )}

        {currentView === 'bot-detection' && (
          <BotDetectionPanel />
        )}

        {currentView === 'pricing' && safeBands.length > 0 && (
          <CategoryPricing bandId={safeBands[0].id} />
        )}
      </main>
    </div>
  )
}

export default App
