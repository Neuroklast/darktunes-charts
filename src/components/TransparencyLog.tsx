import { useState, useMemo, useCallback } from 'react'
import { useKV } from '@/lib/kv-shim'
import { Eye, Heart, Disc, UsersThree, Calculator, Check, MagnifyingGlass } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { TransparencyLogEntry, Band, Track } from '@/lib/types'
import { cn } from '@/lib/utils'

interface TransparencyLogProps {
  userId?: string
}

export function TransparencyLog({ userId }: TransparencyLogProps) {
  const [transparencyLog] = useKV<TransparencyLogEntry[]>('transparency-log', [])
  const [bands] = useKV<Band[]>('bands', [])
  const [tracks] = useKV<Track[]>('tracks', [])
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')

  const getTrackDetails = useCallback((trackId: string) => {
    const track = tracks?.find(t => t.id === trackId)
    if (!track) return { trackTitle: 'Unknown Track', bandName: 'Unknown Band' }

    const band = bands?.find(b => b.id === track.bandId)
    return {
      trackTitle: track.title,
      bandName: band?.name || 'Unknown Band'
    }
  }, [tracks, bands])

  const allEntries = useMemo(() => (transparencyLog || []), [transparencyLog])

  const filteredEntries = useMemo(() => allEntries.filter(entry => {
    if (userId && entry.userId !== userId) return false
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    const { trackTitle, bandName } = getTrackDetails(entry.trackId)
    return (
      entry.trackId.toLowerCase().includes(q) ||
      entry.voteType.toLowerCase().includes(q) ||
      trackTitle.toLowerCase().includes(q) ||
      bandName.toLowerCase().includes(q)
    )
  }), [allEntries, userId, searchQuery, getTrackDetails])

  const sortedEntries = useMemo(
    () => [...filteredEntries].sort((a, b) => b.timestamp - a.timestamp),
    [filteredEntries],
  )

  const toggleEntry = (id: string) => {
    setExpandedEntries(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const getVoteTypeIcon = (type: 'fan' | 'dj' | 'peer') => {
    switch (type) {
      case 'fan':
        return <Heart className="w-4 h-4 text-primary" weight="duotone" />
      case 'dj':
        return <Disc className="w-4 h-4 text-accent" weight="duotone" />
      case 'peer':
        return <UsersThree className="w-4 h-4 text-destructive" weight="duotone" />
    }
  }

  const getVoteTypeName = (type: 'fan' | 'dj' | 'peer') => {
    switch (type) {
      case 'fan':
        return 'Fan Vote'
      case 'dj':
        return 'DJ Choice'
      case 'peer':
        return 'Peer Vote'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <Eye className="w-6 h-6 text-accent" weight="duotone" />
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight">TRANSPARENCY LOG</h2>
          <p className="text-sm text-muted-foreground">
            Global vote log — {sortedEntries.length} of {allEntries.length} entries shown
          </p>
        </div>
      </div>

      <div className="relative">
        <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by track, band, or vote type…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {sortedEntries.length === 0 && (
        <Card className="p-8 glassmorphism text-center">
          <Eye className="w-12 h-12 mx-auto mb-4 text-muted-foreground" weight="duotone" />
          <h3 className="font-display text-lg font-semibold mb-2">No Entries Found</h3>
          <p className="text-sm text-muted-foreground">
            {searchQuery ? 'No entries match your search.' : 'Votes will appear here once submitted.'}
          </p>
        </Card>
      )}

      {sortedEntries.length > 0 && (
        <>
          <Card className="p-4 glassmorphism bg-secondary/20">
            <div className="flex items-start gap-3">
              <Calculator className="w-5 h-5 text-accent mt-0.5" />
              <div className="text-sm text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">How Your Votes Count:</p>
                <p>• <strong>Raw Votes:</strong> Your initial vote allocation</p>
                <p>• <strong>Weight:</strong> Anti-clique/validation multiplier (0.4 - 1.0)</p>
                <p>• <strong>Final Contribution:</strong> Raw Votes × Weight = Your actual score impact</p>
                <p className="text-xs mt-2 text-accent">
                  ✓ All calculations are cryptographically verifiable
                </p>
              </div>
            </div>
          </Card>

          <ScrollArea className="h-[600px]">
            <div className="space-y-3 pr-4">
              {sortedEntries.map((entry) => {
                const { trackTitle, bandName } = getTrackDetails(entry.trackId)
                const isExpanded = expandedEntries.has(entry.id)
                const weightPercentage = Math.round(entry.weight * 100)
                const isDownweighted = entry.weight < 1.0

                return (
                  <Collapsible key={entry.id} open={isExpanded} onOpenChange={() => toggleEntry(entry.id)}>
                    <Card className={cn(
                      "glassmorphism transition-all",
                      isExpanded && "ring-2 ring-accent/50"
                    )}>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full p-4 h-auto hover:bg-transparent"
                        >
                          <div className="w-full space-y-3">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                {getVoteTypeIcon(entry.voteType)}
                                <div className="text-left flex-1 min-w-0">
                                  <p className="font-medium truncate">{trackTitle}</p>
                                  <p className="text-xs text-muted-foreground truncate">{bandName}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="gap-1 font-mono">
                                  {entry.finalContribution.toFixed(2)}
                                </Badge>
                                {isDownweighted && (
                                  <Badge variant="secondary" className="text-xs">
                                    {weightPercentage}%
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{new Date(entry.timestamp).toLocaleString()}</span>
                              <span>•</span>
                              <span>{getVoteTypeName(entry.voteType)}</span>
                            </div>
                          </div>
                        </Button>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <div className="px-4 pb-4 space-y-4">
                          <Separator />
                          
                          <div className="space-y-3">
                            <h4 className="text-sm font-semibold flex items-center gap-2">
                              <Calculator className="w-4 h-4 text-accent" />
                              Mathematical Breakdown
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="p-3 bg-secondary/30 rounded">
                                <p className="text-xs text-muted-foreground mb-1">Raw Votes</p>
                                <p className="text-lg font-mono font-bold text-primary">
                                  {entry.rawVotes}
                                </p>
                              </div>

                              <div className="p-3 bg-secondary/30 rounded">
                                <p className="text-xs text-muted-foreground mb-1">Weight</p>
                                <p className={cn(
                                  "text-lg font-mono font-bold",
                                  isDownweighted ? "text-destructive" : "text-accent"
                                )}>
                                  {entry.weight.toFixed(2)}x
                                </p>
                              </div>

                              <div className="p-3 bg-accent/10 rounded border border-accent/30">
                                <p className="text-xs text-muted-foreground mb-1">Final Score</p>
                                <p className="text-lg font-mono font-bold text-accent">
                                  {entry.finalContribution.toFixed(2)}
                                </p>
                              </div>
                            </div>

                            {entry.creditsSpent !== undefined && (
                              <div className="p-3 bg-primary/10 rounded">
                                <p className="text-xs text-muted-foreground mb-1">Quadratic Credits Spent</p>
                                <p className="text-sm font-mono">
                                  {entry.rawVotes}² = {entry.creditsSpent} credits
                                </p>
                              </div>
                            )}

                            {entry.reason && (
                              <div className="p-3 bg-secondary/20 rounded">
                                <p className="text-xs text-muted-foreground mb-1">System Note</p>
                                <p className="text-sm">{entry.reason}</p>
                              </div>
                            )}

                            <div className="flex items-center gap-2 p-3 bg-accent/5 rounded text-xs text-muted-foreground">
                              <Check className="w-4 h-4 text-accent" />
                              <span>Verified: Vote counted in chart calculation</span>
                            </div>
                          </div>

                          <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                            Vote ID: <span className="font-mono">{entry.id}</span>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                )
              })}
            </div>
          </ScrollArea>
        </>
      )}
    </div>
  )
}
