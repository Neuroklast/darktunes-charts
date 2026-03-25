import { useState, useEffect, useRef, useCallback } from 'react'
import { useKV } from '@/lib/kv-shim'
import {
  ChartLineUp,
  Heart,
  Disc,
  ChartBar,
  Robot,
  Eye,
  Shield,
  List,
  SignIn,
  SignOut,
  User,
  CaretDown,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TransparencyLog } from '@/components/TransparencyLog'
import { BotDetectionPanel } from '@/components/BotDetectionPanel'
import { CategoryPricing } from '@/components/CategoryPricing'
import { ChartsView } from '@/features/charts/ChartsView'
import { CategoriesView } from '@/features/categories/CategoriesView'
import { FanVoteView } from '@/features/fan-vote/FanVoteView'
import { DJVoteView } from '@/features/dj-voting/DJVoteView'
import { ARDashboardView } from '@/features/ar/ARDashboardView'
import { AIScoutView } from '@/features/ai-scout/AIScoutView'
import { AuthProvider, useAuth } from '@/features/auth/AuthContext'
import { LoginModal } from '@/features/auth/LoginModal'
import { ErrorBoundary, ErrorFallbackCard } from '@/components/ErrorBoundary'
import type { Band, Track, FanVote, CategoryGroup, TransparencyLogEntry } from '@/lib/types'
import { calculateQuadraticCost, validateFanVotes } from '@/lib/voting'
import { createTransparencyLogEntry } from '@/lib/votingAudit'
import { SEED_BANDS, SEED_TRACKS } from '@/lib/seedData'
import { toast } from 'sonner'
import logoImg from '@/assets/images/logo_(1).png'

/** Default vote weight applied to fan votes — may be reduced by bot-detection heuristics. */
const DEFAULT_VOTE_WEIGHT = 1.0

/** Top-level navigation item descriptor. */
interface NavItem {
  view: View
  label: string
  icon: React.ReactNode
}

const PRIMARY_NAV: NavItem[] = [
  { view: 'charts',      label: 'Charts',      icon: <ChartLineUp className="w-4 h-4" /> },
  { view: 'categories',  label: 'Kategorien',  icon: <List className="w-4 h-4" /> },
  { view: 'fan-vote',    label: 'Fan Vote',    icon: <Heart className="w-4 h-4" /> },
  { view: 'dj-vote',     label: 'DJ Vote',     icon: <Disc className="w-4 h-4" /> },
  { view: 'ar',          label: 'A&R',         icon: <ChartBar className="w-4 h-4" /> },
  { view: 'ai',          label: 'AI Scout',    icon: <Robot className="w-4 h-4" /> },
]

const SECONDARY_NAV: NavItem[] = [
  { view: 'transparency',  label: 'Log',        icon: <Eye className="w-4 h-4" /> },
  { view: 'bot-detection', label: 'Security',   icon: <Shield className="w-4 h-4" /> },
]

/** Role badge colour/text map for the user menu. */
const ROLE_LABELS: Record<string, string> = {
  admin:  'Admin',
  editor: 'Redakteur',
  dj:     'DJ',
  band:   'Band',
  fan:    'Fan',
  ar:     'A&R',
}

// ---------------------------------------------------------------------------
// Inner app (requires AuthProvider in tree)
// ---------------------------------------------------------------------------

function AppContent() {
  const { user, isAuthenticated, logout } = useAuth()
  const [bands, setBands] = useKV<Band[]>('bands', [])
  const [tracks, setTracks] = useKV<Track[]>('tracks', [])
  const [fanVotes, setFanVotes] = useKV<Record<string, FanVote>>('fanVotes', {})
  const [, setTransparencyLog] = useKV<TransparencyLogEntry[]>('transparency-log', [])
  const [currentView, setCurrentView] = useState<View>('charts')
  const [selectedCategoryGroup, setSelectedCategoryGroup] = useState<CategoryGroup>('music')
  const [selectedCategory, setSelectedCategory] = useState<string>('track')
  const [loginOpen, setLoginOpen] = useState(false)

  const safeBands = bands ?? []
  const safeTracks = tracks ?? []
  const safeFanVotes = fanVotes ?? {}

  // Ref guard prevents double-seeding in React Strict Mode
  const seededRef = useRef(false)
  useEffect(() => {
    if (seededRef.current) return
    seededRef.current = true
    if ((bands ?? []).length === 0) setBands([...SEED_BANDS])
    if ((tracks ?? []).length === 0) setTracks([...SEED_TRACKS])
  }, [bands, tracks, setBands, setTracks])

  const handleVoteChange = useCallback((trackId: string, votes: number) => {
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
  }, [setFanVotes])

  const handleSubmitVotes = useCallback(() => {
    const validation = validateFanVotes(Object.values(safeFanVotes))
    if (!validation.valid) {
      toast.error('Abstimmung ungültig', { description: 'Credits überschreiten das Budget von 100.' })
      return
    }
    const newEntries = Object.values(safeFanVotes).map(vote =>
      createTransparencyLogEntry(vote.trackId, user?.id ?? 'anonymous', 'fan', vote.votes, vote.creditsSpent, DEFAULT_VOTE_WEIGHT)
    )
    setTransparencyLog(current => [...(current ?? []), ...newEntries])
    toast.success('Stimmen erfolgreich eingereicht!', { description: `${validation.totalCredits} Credits verbraucht` })
  }, [safeFanVotes, setTransparencyLog, user])

  const handleResetVotes = useCallback(() => {
    setFanVotes({})
    toast.info('Alle Stimmen zurückgesetzt')
  }, [setFanVotes])

  const renderNavButton = useCallback(({ view, label, icon }: NavItem) => (
    <Button
      key={view}
      variant={currentView === view ? 'default' : 'ghost'}
      size="sm"
      onClick={() => setCurrentView(view)}
      className="gap-2 transition-all duration-200"
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Button>
  ), [currentView])

  const renderView = () => {
    const view = (() => {
      switch (currentView) {
        case 'charts':
          return <ChartsView bands={safeBands} tracks={safeTracks} fanVotes={safeFanVotes} />

        case 'categories':
          return (
            <CategoriesView
              bands={safeBands}
              tracks={safeTracks}
              fanVotes={safeFanVotes}
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
              onResetVotes={handleResetVotes}
            />
          )

        case 'dj-vote':
          return <DJVoteView bands={safeBands} tracks={safeTracks} />

        case 'ar':
          return <ARDashboardView bands={safeBands} tracks={safeTracks} fanVotes={safeFanVotes} />

        case 'ai':
          return <AIScoutView bands={safeBands} />

        case 'transparency':
          return <TransparencyLog />

        case 'bot-detection':
          return <BotDetectionPanel />

        case 'pricing':
          return safeBands.length > 0 ? <CategoryPricing bandId={safeBands[0].id} /> : null

        default:
          return null
      }
    })()
    return <ErrorBoundary FallbackComponent={ErrorFallbackCard}>{view}</ErrorBoundary>
  }

  return (
    <div className="min-h-screen bg-background gradient-mesh">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 glassmorphism">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Logo + wordmark */}
          <button
            className="flex items-center gap-3 shrink-0 group"
            onClick={() => setCurrentView('charts')}
            aria-label="Zur Startseite"
          >
            <img
              src={logoImg}
              alt="darkTunes Logo"
              className="h-8 w-auto transition-transform duration-300 group-hover:scale-105"
            />
            <div className="hidden sm:block">
              <h1 className="text-lg font-display font-bold tracking-tight leading-none">darkTunes CHARTS</h1>
              <p className="text-[10px] text-muted-foreground font-display tracking-[0.15em] leading-none mt-0.5">
                FAIR · TRANSPARENT · INNOVATIV
              </p>
            </div>
          </button>

          {/* Primary nav */}
          <nav className="flex items-center gap-1 overflow-x-auto" aria-label="Hauptnavigation">
            {PRIMARY_NAV.map(renderNavButton)}
            <Separator orientation="vertical" className="h-6 mx-1" />
            {SECONDARY_NAV.map(renderNavButton)}
          </nav>

          {/* Auth button */}
          <div className="shrink-0">
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <User className="w-4 h-4" />
                    <span className="hidden md:inline max-w-[100px] truncate">{user.name}</span>
                    <Badge variant="secondary" className="hidden md:inline-flex text-[10px] py-0 px-1">
                      {ROLE_LABELS[user.role] ?? user.role}
                    </Badge>
                    <CaretDown className="w-3 h-3 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glassmorphism w-48">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">{user.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => logout()}
                    className="gap-2 text-destructive focus:text-destructive"
                  >
                    <SignOut className="w-4 h-4" />
                    Abmelden
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="gap-2 border-primary/40 hover:border-primary transition-colors duration-200"
                onClick={() => setLoginOpen(true)}
              >
                <SignIn className="w-4 h-4" />
                <span className="hidden sm:inline">Anmelden</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container max-w-7xl mx-auto px-4 sm:px-6 py-8">{renderView()}</main>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Root export wraps everything in AuthProvider
// ---------------------------------------------------------------------------

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
