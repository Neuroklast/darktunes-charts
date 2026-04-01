import { useMemo } from 'react'
import { Disc } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CategorySelector } from '@/components/CategorySelector'
import type { Band, Track, CategoryGroup, AllCategory, FanVote } from '@/lib/types'
import { getCategoryMetadata, canBandCompeteInCategory, calculateCategoryScore } from '@/lib/categories'
import { seededRandom } from '@/lib/utils'

interface CategoriesViewProps {
  bands: Band[]
  tracks: Track[]
  fanVotes: Record<string, FanVote>
  selectedGroup: CategoryGroup
  selectedCategory: string
  onGroupChange: (group: CategoryGroup) => void
  onCategoryChange: (category: string) => void
}

function EmptyCategoryNominees() {
  return (
    <div className="py-12 text-center">
      <Disc className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" weight="duotone" />
      <p className="font-semibold mb-1">No Nominees Yet</p>
      <p className="text-sm text-muted-foreground">
        Bands matching this category's criteria will appear here once submitted.
      </p>
    </div>
  )
}

interface EligibleTrackRow {
  track: Track
  band: Band
  fanCredits: number
  compositeScore: number
}

/**
 * Renders the category voting view with selector and eligible nominees.
 *
 * Shows real fan credit totals for each track. Categories enforce tier
 * restrictions (e.g., Underground Anthem only shows Micro/Emerging bands).
 */
export function CategoriesView({
  bands,
  tracks,
  fanVotes,
  selectedGroup,
  selectedCategory,
  onGroupChange,
  onCategoryChange,
}: CategoriesViewProps) {
  const categoryMeta = getCategoryMetadata(selectedCategory as AllCategory)

  const eligibleRows = useMemo<EligibleTrackRow[]>(() => {
    return tracks
      .filter(track => {
        const band = bands.find(b => b.id === track.bandId)
        if (!band) return false
        return canBandCompeteInCategory(selectedCategory as AllCategory, band.tier, band.spotifyMonthlyListeners)
      })
      .map((track, idx) => {
        const band = bands.find(b => b.id === track.bandId)!
        const fanCredits = fanVotes[track.id]?.creditsSpent ?? 0
        const djScore = Math.floor(seededRandom(idx * 7 + 1) * 100)
        const compositeScore = calculateCategoryScore(selectedCategory as AllCategory, fanCredits, djScore)
        return { track, band, fanCredits, compositeScore }
      })
      .sort((a, b) => b.compositeScore - a.compositeScore)
  }, [tracks, bands, fanVotes, selectedCategory])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-display font-bold tracking-tight mb-2">CATEGORY VOTING</h2>
        <p className="text-muted-foreground">
          Specialized categories across Music, Visuals, Community, and Newcomer groups
        </p>
      </div>

      <CategorySelector
        selectedGroup={selectedGroup}
        selectedCategory={selectedCategory}
        onGroupChange={onGroupChange}
        onCategoryChange={onCategoryChange}
      />

      <Card className="p-6 glassmorphism">
        <div className="mb-4">
          <h3 className="font-display text-xl font-semibold mb-2">{categoryMeta.name}</h3>
          <p className="text-sm text-muted-foreground">{categoryMeta.description}</p>
          {categoryMeta.tierRestriction && (
            <div className="flex gap-2 mt-2">
              {categoryMeta.tierRestriction.map(tier => (
                <Badge key={tier} variant="outline" className="text-xs">
                  {tier} only
                </Badge>
              ))}
            </div>
          )}
        </div>

        {eligibleRows.length === 0 ? (
          <EmptyCategoryNominees />
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="space-y-3 pr-4">
              {eligibleRows.map(({ track, band, fanCredits, compositeScore }, rank) => (
                <div key={track.id} className="p-4 bg-secondary/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-muted-foreground w-6 text-sm">
                        {rank + 1}
                      </span>
                      <div>
                        <p className="font-semibold">{track.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {band.name} • {band.tier}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {fanCredits} credits
                      </Badge>
                      <Badge variant="default" className="font-mono">
                        {compositeScore.toFixed(1)} pts
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </Card>
    </div>
  )
}
