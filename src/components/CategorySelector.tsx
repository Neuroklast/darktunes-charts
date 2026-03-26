import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CATEGORY_GROUPS, CATEGORY_DEFINITIONS, type CategoryMetadata } from '@/lib/categories'
import type { CategoryGroup } from '@/lib/types'
import { 
  Disc, 
  Microphone, 
  Package, 
  FilmSlate,
  Newspaper, 
  HandHeart, 
  PenNib, 
  Flame, 
  BookOpen
} from '@phosphor-icons/react'

import type { Icon as PhosphorIcon } from '@phosphor-icons/react'

const ICON_MAP: Record<string, React.ComponentType<React.ComponentProps<PhosphorIcon>>> = {
  'Disc': Disc,
  'Vinyl': Disc,
  'Microphone': Microphone,
  'GuitarPick': Disc,
  'Waveform': Disc,
  'Package': Package,
  'TShirt': Package,
  'FilmSlate': FilmSlate,
  'Newspaper': Newspaper,
  'HandHeart': HandHeart,
  'PenNib': PenNib,
  'FlameSimple': Flame,
  'Book': BookOpen
}

interface CategorySelectorProps {
  selectedGroup: CategoryGroup
  selectedCategory: string
  onGroupChange: (group: CategoryGroup) => void
  onCategoryChange: (category: string) => void
}

export function CategorySelector({
  selectedGroup,
  selectedCategory,
  onGroupChange,
  onCategoryChange
}: CategorySelectorProps) {
  const currentGroup = CATEGORY_GROUPS[selectedGroup]
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(Object.keys(CATEGORY_GROUPS) as CategoryGroup[]).map((groupKey) => {
          const group = CATEGORY_GROUPS[groupKey]
          const isSelected = selectedGroup === groupKey
          
          return (
            <Card
              key={groupKey}
              className={`p-4 cursor-pointer transition-all glassmorphism ${
                isSelected ? 'border-accent ring-2 ring-accent/30' : 'hover:border-accent/50'
              }`}
              onClick={() => onGroupChange(groupKey)}
            >
              <h3 className="font-display font-semibold text-sm mb-1">{group.name}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2">{group.description}</p>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentGroup.categories.map((catId) => {
          const catMeta = CATEGORY_DEFINITIONS[catId] as CategoryMetadata
          const Icon = ICON_MAP[catMeta.icon] || Disc
          const isSelected = selectedCategory === catId
          
          return (
            <Card
              key={catId}
              className={`p-6 cursor-pointer transition-all glassmorphism hover:bg-card/60 ${
                isSelected ? 'border-primary ring-2 ring-primary/30 bg-card/60' : ''
              }`}
              onClick={() => onCategoryChange(catId)}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  isSelected ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'
                }`}>
                  <Icon className="w-6 h-6" weight="duotone" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-display font-semibold mb-1 text-sm">{catMeta.name}</h4>
                  <p className="text-xs text-muted-foreground mb-3">{catMeta.description}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">
                      Fan {Math.round(catMeta.fanWeight * 100)}%
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Peer {Math.round(catMeta.peerWeight * 100)}%
                    </Badge>
                    {catMeta.maxListeners && (
                      <Badge variant="secondary" className="text-xs">
                        &lt;{catMeta.maxListeners / 1000}k
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
