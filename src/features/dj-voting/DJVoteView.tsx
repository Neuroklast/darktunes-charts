import { useState, useCallback } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, ArrowsDownUp, MathOperations, ArrowUp, ArrowDown, GridFour } from '@phosphor-icons/react'
import { Band, Track } from '@/lib/types'
import { calculateSchulzeMethod, BallotRanking, getPairwiseComparison } from '@/lib/schulze'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

interface DJVoteViewProps {
  bands: Band[]
  tracks: Track[]
}

export function DJVoteView({ bands, tracks }: DJVoteViewProps) {
  const [djBallots, setDjBallots] = useKV<BallotRanking[]>('dj-ballots', [])
  const [currentRankings, setCurrentRankings] = useState<string[]>(
    tracks.slice(0, 8).map(t => t.id)
  )
  const [showCalculation, setShowCalculation] = useState(false)

  const handleMoveUp = useCallback((index: number) => {
    if (index === 0) return
    setCurrentRankings((items) => {
      const newItems = [...items]
      ;[newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]]
      return newItems
    })
  }, [])

  const handleMoveDown = useCallback((index: number) => {
    setCurrentRankings((items) => {
      if (index === items.length - 1) return items
      const newItems = [...items]
      ;[newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]]
      return newItems
    })
  }, [])

  const handleSubmit = useCallback(() => {
    const newBallot: BallotRanking = {
      djId: `dj-${Date.now()}`,
      rankings: [...currentRankings]
    }

    setDjBallots((current) => [...(current ?? []), newBallot])
    toast.success('DJ ballot submitted!', {
      description: `${currentRankings.length} tracks ranked`
    })
  }, [currentRankings, setDjBallots])

  const handleReset = useCallback(() => {
    setCurrentRankings(tracks.slice(0, 8).map(t => t.id))
    toast.info('Rankings reset')
  }, [tracks])

  const schulzeResult = (djBallots && djBallots.length > 0)
    ? calculateSchulzeMethod(
        tracks.map(t => t.id),
        djBallots
      )
    : null

  const getBandForTrack = (trackId: string) => {
    const track = tracks.find(t => t.id === trackId)
    return track ? bands.find(b => b.id === track.bandId) : undefined
  }

  const getTrack = (trackId: string) => tracks.find(t => t.id === trackId)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold tracking-tight">DJ Ranked Voting</h2>
          <p className="text-muted-foreground mt-2">
            Rank tracks by preference. Results calculated using the Schulze method for Condorcet-compliant consensus.
          </p>
        </div>
        <Badge variant="secondary" className="font-mono text-xs">
          {(djBallots ?? []).length} ballots submitted
        </Badge>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6 glassmorphism">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ArrowsDownUp className="w-5 h-5 text-primary" weight="duotone" />
              <h3 className="text-xl font-display font-semibold">Your Rankings</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Reset
            </Button>
          </div>

          <div className="space-y-2">
            {currentRankings.map((trackId, index) => {
              const track = getTrack(trackId)
              const band = getBandForTrack(trackId)
              
              if (!track || !band) return null

              return (
                <div
                  key={trackId}
                  className="flex items-center gap-2 p-3 rounded-lg bg-card border border-border/50 hover:border-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/20 text-primary font-display font-bold shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{track.title}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {band.name}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                    >
                      <ArrowUp className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === currentRankings.length - 1}
                    >
                      <ArrowDown className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          <Separator className="my-4" />

          <div className="flex gap-2">
            <Button onClick={handleSubmit} className="flex-1 gap-2">
              <CheckCircle className="w-4 h-4" weight="duotone" />
              Submit Ballot
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowCalculation(!showCalculation)}
            >
              <GridFour className="w-4 h-4" />
            </Button>
          </div>
        </Card>

        <Card className="p-6 glassmorphism">
          <div className="flex items-center gap-2 mb-4">
            <MathOperations className="w-5 h-5 text-accent" weight="duotone" />
            <h3 className="text-xl font-display font-semibold">Schulze Method Results</h3>
          </div>

          {schulzeResult ? (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground mb-4">
                Condorcet winner determined through strongest path analysis
              </div>

              {schulzeResult.rankings.slice(0, 10).map((trackId, index) => {
                const track = getTrack(trackId)
                const band = getBandForTrack(trackId)
                
                if (!track || !band) return null

                return (
                  <div
                    key={trackId}
                    className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/50"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/20 text-primary font-display font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{track.title}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        {band.name}
                      </div>
                    </div>
                    <Badge variant="outline" className="font-mono text-xs">
                      {band.tier}
                    </Badge>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <GridFour className="w-12 h-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">
                No ballots submitted yet. Submit your first ballot to see results.
              </p>
            </div>
          )}
        </Card>
      </div>

      {showCalculation && schulzeResult && (
        <Card className="p-6 glassmorphism">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <GridFour className="w-5 h-5 text-accent" weight="duotone" />
              <h3 className="text-xl font-display font-semibold">Schulze Method Calculation</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowCalculation(false)}>
              Close
            </Button>
          </div>

          <Tabs defaultValue="pairwise" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pairwise">Pairwise</TabsTrigger>
              <TabsTrigger value="strongest">Strongest Path</TabsTrigger>
              <TabsTrigger value="comparison">Head-to-Head</TabsTrigger>
            </TabsList>

            <TabsContent value="pairwise" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Pairwise preference matrix showing how many ballots prefer row over column
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="p-2 text-left font-mono text-xs"></th>
                      {schulzeResult.candidates.slice(0, 8).map((id) => {
                        const track = getTrack(id)
                        return (
                          <th key={id} className="p-2 text-center font-mono text-xs">
                            {track ? track.title.slice(0, 8) : id.slice(0, 8)}
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {schulzeResult.candidates.slice(0, 8).map((rowId, i) => {
                      const rowTrack = getTrack(rowId)
                      return (
                        <tr key={rowId} className="border-t border-border/50">
                          <td className="p-2 font-mono text-xs truncate max-w-[100px]">
                            {rowTrack ? rowTrack.title.slice(0, 12) : rowId.slice(0, 12)}
                          </td>
                          {schulzeResult.candidates.slice(0, 8).map((colId, j) => {
                            const value = schulzeResult.pairwiseMatrix[i][j]
                            const opposite = schulzeResult.pairwiseMatrix[j][i]
                            const isWinner = value > opposite
                            return (
                              <td
                                key={colId}
                                className={cn(
                                  "p-2 text-center font-mono",
                                  i === j && "bg-muted/50",
                                  isWinner && i !== j && "bg-primary/20 text-primary font-bold"
                                )}
                              >
                                {value}
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="strongest" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Strongest path matrix using Floyd-Warshall algorithm
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="p-2 text-left font-mono text-xs"></th>
                      {schulzeResult.candidates.slice(0, 8).map((id) => {
                        const track = getTrack(id)
                        return (
                          <th key={id} className="p-2 text-center font-mono text-xs">
                            {track ? track.title.slice(0, 8) : id.slice(0, 8)}
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {schulzeResult.candidates.slice(0, 8).map((rowId, i) => {
                      const rowTrack = getTrack(rowId)
                      return (
                        <tr key={rowId} className="border-t border-border/50">
                          <td className="p-2 font-mono text-xs truncate max-w-[100px]">
                            {rowTrack ? rowTrack.title.slice(0, 12) : rowId.slice(0, 12)}
                          </td>
                          {schulzeResult.candidates.slice(0, 8).map((colId, j) => {
                            const value = schulzeResult.strongestPathMatrix[i][j]
                            const opposite = schulzeResult.strongestPathMatrix[j][i]
                            const isWinner = value > opposite
                            return (
                              <td
                                key={colId}
                                className={cn(
                                  "p-2 text-center font-mono",
                                  i === j && "bg-muted/50",
                                  isWinner && i !== j && "bg-accent/20 text-accent font-bold"
                                )}
                              >
                                {value}
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="comparison" className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">
                Direct head-to-head comparisons between top candidates
              </p>
              {schulzeResult.rankings.slice(0, 5).map((trackAId, i) => {
                const trackA = getTrack(trackAId)
                const bandA = getBandForTrack(trackAId)
                
                return schulzeResult.rankings.slice(i + 1, 5).map((trackBId) => {
                  const trackB = getTrack(trackBId)
                  const bandB = getBandForTrack(trackBId)
                  const comparison = getPairwiseComparison(schulzeResult, trackAId, trackBId)
                  
                  if (!trackA || !bandA || !trackB || !bandB) return null

                  return (
                    <div
                      key={`${trackAId}-${trackBId}`}
                      className="p-4 rounded-lg border border-border/50 bg-card/50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className={cn(
                            "font-medium",
                            comparison.winner === trackAId && "text-accent"
                          )}>
                            {trackA.title}
                          </div>
                          <div className="text-xs text-muted-foreground">{bandA.name}</div>
                        </div>
                        <div className="px-6 text-center">
                          <div className="font-mono font-bold text-lg">
                            {comparison.aWins} - {comparison.bWins}
                          </div>
                          <div className="text-xs text-muted-foreground">ballots</div>
                        </div>
                        <div className="flex-1 text-right">
                          <div className={cn(
                            "font-medium",
                            comparison.winner === trackBId && "text-accent"
                          )}>
                            {trackB.title}
                          </div>
                          <div className="text-xs text-muted-foreground">{bandB.name}</div>
                        </div>
                      </div>
                    </div>
                  )
                })
              })}
            </TabsContent>
          </Tabs>
        </Card>
      )}
    </div>
  )
}
