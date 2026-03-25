import { Disc } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CategorySelector } from '@/components/CategorySelector'
import type { Band, Track, CategoryGroup, AllCategory } from '@/lib/types'
import { getCategoryMetadata, canBandCompeteInCategory } from '@/lib/categories'

interface CategoriesViewProps {
  bands: Band[]
  tracks: Track[]
  selectedGroup: CategoryGroup
  selectedCategory: string
  onGroupChange: (group: CategoryGroup) => void
  onCategoryChange: (category: string) => void
}

/** Seeded-random helper for stable points display. */
function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}

/** Empty state when no nominees match the selected category and its restrictions. */
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

/**
 * Renders the category voting view with selector and eligible nominees.
 *
 * Categories enforce tier restrictions (e.g., Underground Anthem only shows
 * bands with fewer than 10k monthly listeners).
 */
export function CategoriesView({
  bands,
  tracks,
  selectedGroup,
  selectedCategory,
  onGroupChange,
  onCategoryChange,
}: CategoriesViewProps) {
  const categoryMeta = getCategoryMetadata(selectedCategory as AllCategory)

  const eligibleTracks = tracks.filter(track => {
    const band = bands.find(b => b.id === track.bandId)
    if (!band) return false
    return canBandCompeteInCategory(selectedCategory as AllCategory, band.tier, band.spotifyMonthlyListeners)
  })

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

        <div className="space-y-3">
          {eligibleTracks.length === 0 ? (
            <EmptyCategoryNominees />
          ) : (
            eligibleTracks.slice(0, 5).map((track, idx) => {
              const band = bands.find(b => b.id === track.bandId)
              if (!band) return null

              const points = Math.floor(seededRandom(idx * 7) * 100 + 20)

              return (
                <div key={track.id} className="p-4 bg-secondary/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{track.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {band.name} • {band.tier}
                      </p>
                    </div>
                    <Badge variant="outline" className="font-mono">
                      {points} pts
                    </Badge>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </Card>
    </div>
  )
}
