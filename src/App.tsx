import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import {
  ChartLineUp,
  Heart,
  Disc,
  ChartBar,
  Robot,
  Eye,
  Shield,
  List,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { TransparencyLog } from '@/components/TransparencyLog'
import { BotDetectionPanel } from '@/components/BotDetectionPanel'
import { CategoryPricing } from '@/components/CategoryPricing'
import { ChartsView } from '@/features/charts/ChartsView'
import { CategoriesView } from '@/features/categories/CategoriesView'
import { FanVoteView } from '@/features/fan-vote/FanVoteView'
import { ARDashboardView } from '@/features/ar/ARDashboardView'
import { AIScoutView } from '@/features/ai-scout/AIScoutView'
import type { Band, Track, FanVote, CategoryGroup } from '@/lib/types'
import { calculateQuadraticCost, validateFanVotes } from '@/lib/voting'
import { SEED_BANDS, SEED_TRACKS } from '@/lib/seedData'
import { toast } from 'sonner'

type View = 'charts' | 'categories' | 'fan-vote' | 'ar' | 'ai' | 'transparency' | 'bot-detection' | 'pricing'

/** Top-level navigation item descriptor. */
interface NavItem {
  view: View
  label: string
  icon: React.ReactNode
}

const PRIMARY_NAV: NavItem[] = [
  { view: 'charts',      label: 'Charts',    icon: <ChartLineUp className="w-4 h-4" /> },
  { view: 'categories',  label: 'Categories', icon: <List className="w-4 h-4" /> },
  { view: 'fan-vote',    label: 'Vote',       icon: <Heart className="w-4 h-4" /> },
  { view: 'ar',          label: 'A&R',        icon: <ChartBar className="w-4 h-4" /> },
  { view: 'ai',          label: 'AI Scout',   icon: <Robot className="w-4 h-4" /> },
]

const SECONDARY_NAV: NavItem[] = [
  { view: 'transparency',  label: 'Log',      icon: <Eye className="w-4 h-4" /> },
  { view: 'bot-detection', label: 'Security', icon: <Shield className="w-4 h-4" /> },
]

function App() {
  const [bands, setBands] = useKV<Band[]>('bands', [])
  const [tracks, setTracks] = useKV<Track[]>('tracks', [])
  const [fanVotes, setFanVotes] = useKV<Record<string, FanVote>>('fanVotes', {})
  const [currentView, setCurrentView] = useState<View>('charts')
  const [selectedCategoryGroup, setSelectedCategoryGroup] = useState<CategoryGroup>('music')
  const [selectedCategory, setSelectedCategory] = useState<string>('track')

  const safeBands = bands ?? []
  const safeTracks = tracks ?? []
  const safeFanVotes = fanVotes ?? {}

  // Seed test data on first load if the KV store is empty
  useEffect(() => {
    if (safeBands.length === 0) {
      setBands([...SEED_BANDS])
    }
    if (safeTracks.length === 0) {
      setTracks([...SEED_TRACKS])
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleVoteChange = (trackId: string, votes: number) => {
    setFanVotes(current => {
      const updated = { ...(current ?? {}) }
      if (votes === 0) {
        delete updated[trackId]
      } else {
        updated[trackId] = {
          trackId,
          votes,
          creditsSpent: calculateQuadraticCost(votes),
        }
      }
      return updated
    })
  }

  const handleSubmitVotes = () => {
    const validation = validateFanVotes(Object.values(safeFanVotes))
    if (validation.valid) {
      toast.success('Votes submitted successfully!', {
        description: `${validation.totalCredits} credits spent`,
      })
    } else {
      toast.error('Cannot submit votes', {
        description: 'Total credits exceed 100',
      })
    }
  }

  const renderNavButton = ({ view, label, icon }: NavItem) => (
    <Button
      key={view}
      variant={currentView === view ? 'default' : 'ghost'}
      size="sm"
      onClick={() => setCurrentView(view)}
      className="gap-2"
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Button>
  )

  const renderView = () => {
    switch (currentView) {
      case 'charts':
        return <ChartsView bands={safeBands} tracks={safeTracks} />

      case 'categories':
        return (
          <CategoriesView
            bands={safeBands}
            tracks={safeTracks}
            selectedGroup={selectedCategoryGroup}
            selectedCategory={selectedCategory}
            onGroupChange={setSelectedCategoryGroup}
            onCategoryChange={setSelectedCategory}
          />
        )

      case 'fan-vote':
        return (
          <FanVoteView
            bands={safeBands}
            tracks={safeTracks}
            fanVotes={safeFanVotes}
            onVoteChange={handleVoteChange}
            onSubmitVotes={handleSubmitVotes}
          />
        )

      case 'ar':
        return <ARDashboardView bands={safeBands} tracks={safeTracks} fanVotes={safeFanVotes} />

      case 'ai':
        return <AIScoutView bands={safeBands} />

      case 'transparency':
        return <TransparencyLog userId="current-user" />

      case 'bot-detection':
        return <BotDetectionPanel />

      case 'pricing':
        return safeBands.length > 0 ? <CategoryPricing bandId={safeBands[0].id} /> : null

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background gradient-mesh">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 glassmorphism">
        <div className="container max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Disc className="w-8 h-8 text-primary" weight="duotone" />
            <div>
              <h1 className="text-xl font-display font-bold tracking-tight">darkTunes CHARTS</h1>
              <p className="text-xs text-muted-foreground font-display tracking-wide">
                FAIR • TRANSPARENT • INNOVATIVE
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {PRIMARY_NAV.map(renderNavButton)}
            <Separator orientation="vertical" className="h-6" />
            {SECONDARY_NAV.map(renderNavButton)}
          </div>
        </div>
      </header>

      <main className="container max-w-7xl mx-auto px-6 py-8">{renderView()}</main>
    </div>
  )
}

export default App
