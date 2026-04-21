import { useState, useCallback, useMemo } from 'react'
import { Heart, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { QuadraticVotingSlider } from '@/components/QuadraticVotingSlider'
import { VotingHelpButton, QuadraticVotingInfo } from '@/features/voting/VotingMethodInfo'
import type { Band, Track, FanVote, Genre } from '@/lib/types'
import { calculateQuadraticCost, MONTHLY_CREDIT_BUDGET } from '@/lib/voting'
import { getTierBadgeVariant } from '@/lib/utils'

type GenreFilter = 'All' | Genre

interface FanVoteViewProps {
  bands: Band[]
  tracks: Track[]
  fanVotes: Record<string, FanVote>
  onVoteChange: (trackId: string, votes: number) => void
  onSubmitVotes: () => void
  onResetVotes?: () => void
}

function EmptyVoteList() {
  return (
    <Card className="p-12 glassmorphism text-center">
      <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-40" weight="duotone" />
      <h3 className="font-display text-xl font-semibold mb-2">Keine Tracks zum Abstimmen</h3>
      <p className="text-muted-foreground text-sm">
        Tracks, die von Bands eingereicht wurden, erscheinen hier während aktiver Abstimmungsphasen.
      </p>
    </Card>
  )
}

/**
 * Renders the fan quadratic voting interface with genre filtering and tier badges.
 *
 * Each fan receives 100 voice credits per month. Casting N votes for a track costs N²
 * credits, incentivising fans to distribute credits across multiple artists rather
 * than concentrating all support on one popular act.
 *
 * A help dialog explains the QV methodology in full transparency per the platform spec
 * (Musik-Charts PDF, Section 4.1).
 */
export function FanVoteView({ bands, tracks, fanVotes, onVoteChange, onSubmitVotes, onResetVotes }: FanVoteViewProps) {
  const [genreFilter, setGenreFilter] = useState<GenreFilter>('All')
  const [showHelp, setShowHelp] = useState(false)

  const usedCredits = useMemo(
    () => Object.values(fanVotes).reduce((sum, vote) => sum + calculateQuadraticCost(vote.votes), 0),
    [fanVotes]
  )
  const availableCredits = MONTHLY_CREDIT_BUDGET - usedCredits
  const votedTrackCount = Object.keys(fanVotes).length

  const filteredTracks = useMemo(
    () =>
      genreFilter === 'All'
        ? tracks
        : tracks.filter(t => {
            const band = bands.find(b => b.id === t.bandId)
            return band?.genre === genreFilter
          }),
    [tracks, bands, genreFilter]
  )

  const handleGenreChange = useCallback((value: string) => {
    setGenreFilter(value as GenreFilter)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold tracking-tight mb-1">FAN VOTING</h2>
          <p className="text-muted-foreground text-sm">
            Quadratic Voting — deine Voice Credits steigen quadratisch
          </p>
          <VotingHelpButton
            onClick={() => setShowHelp(true)}
            label="Wie funktioniert Quadratic Voting?"
            className="mt-1"
          />
        </div>

        <Card className="p-4 glassmorphism min-w-[180px] sm:min-w-[200px]">
          <p className="text-xs text-muted-foreground mb-2">Voice Credits</p>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-mono font-bold">{availableCredits}</span>
            <span className="text-muted-foreground">/ {MONTHLY_CREDIT_BUDGET}</span>
          </div>
          <Progress value={usedCredits} max={MONTHLY_CREDIT_BUDGET} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">{usedCredits} Credits verbraucht</p>
        </Card>
      </div>

      <Tabs value={genreFilter} onValueChange={handleGenreChange}>
        <TabsList>
          <TabsTrigger value="All">Alle</TabsTrigger>
          <TabsTrigger value="Goth">Gothic</TabsTrigger>
          <TabsTrigger value="Metal">Metal</TabsTrigger>
          <TabsTrigger value="Dark Electro">Dark Electro</TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredTracks.length === 0 ? (
        <EmptyVoteList />
      ) : (
        <div className="space-y-4">
          {filteredTracks.map(track => {
            const band = bands.find(b => b.id === track.bandId)
            if (!band) return null

            return (
              <Card
                key={track.id}
                className="p-6 glassmorphism hover:bg-card/70 transition-all duration-300 hover:-translate-y-px"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant={getTierBadgeVariant(band.tier)} className="text-xs">
                    {band.tier}
                  </Badge>
                  <Badge variant="outline" className="text-xs">{band.genre}</Badge>
                </div>
                <QuadraticVotingSlider
                  trackId={track.id}
                  trackTitle={track.title}
                  bandName={band.name}
                  maxVotes={10}
                  currentVotes={fanVotes[track.id]?.votes ?? 0}
                  availableCredits={availableCredits}
                  onVoteChange={onVoteChange}
                />
              </Card>
            )
          })}
        </div>
      )}

      <Card className="p-6 glassmorphism bg-secondary/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-semibold text-lg mb-1">Abstimmungs-Zusammenfassung</h3>
            <p className="text-sm text-muted-foreground">
              {votedTrackCount} {votedTrackCount === 1 ? 'Track' : 'Tracks'} ausgewählt
            </p>
          </div>
          <div className="flex gap-2">
            {onResetVotes && votedTrackCount > 0 && (
              <Button variant="outline" onClick={onResetVotes} className="gap-2">
                <X className="w-4 h-4" />
                Zurücksetzen
              </Button>
            )}
            <Button
              onClick={onSubmitVotes}
              disabled={usedCredits === 0 || usedCredits > MONTHLY_CREDIT_BUDGET}
              className="gap-2"
              size="lg"
            >
              Abstimmen
            </Button>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Inline transparency explanation */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">💡 Quadratic Voting — Transparenz-Info</p>
          <p>• 1 Stimme = 1 Credit &nbsp;|&nbsp; 2 Stimmen = 4 Credits &nbsp;|&nbsp; 3 Stimmen = 9 Credits</p>
          <p>• 5 Stimmen = 25 Credits &nbsp;|&nbsp; 10 Stimmen = 100 Credits (gesamtes Monats-Budget)</p>
          <p>• Stimmen verteilen lohnt sich: je mehr du auf einen Act konzentrierst, desto teurer wird jede weitere Stimme.</p>
          <VotingHelpButton
            onClick={() => setShowHelp(true)}
            label="Vollständige Erklärung lesen"
            className="mt-1"
          />
        </div>
      </Card>

      {/* Help dialog */}
      <QuadraticVotingInfo open={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  )
}
