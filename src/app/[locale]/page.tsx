import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { SEED_BANDS, SEED_TRACKS } from '@/lib/seedData'
import { seededRandom, GENRE_GRADIENTS } from '@/lib/utils'
import { getCachedImageUrl } from '@/lib/imageCache'
import type { Band, Track } from '@/lib/types'
import PillarCards from './_components/PillarCards'
import GenreFilteredTop5 from './_components/GenreFilteredTop5'

/** DJ and Peer score range constants — mirror those in ChartsView. */
const DJ_SCORE_MULTIPLIER   = 30
const DJ_SCORE_BASE         = 5
const PEER_SCORE_MULTIPLIER = 20
const PEER_SCORE_BASE       = 3
const PILLAR_WEIGHT         = 0.333

/** Compute the featured #1 track from seed data for the hero card. */
function buildHeroEntry(): { band: Band; track: Track; compositeScore: number } | null {
  const tracks = SEED_TRACKS as Track[]
  const bands  = SEED_BANDS  as Band[]

  const entries = tracks
    .slice(0, 15)
    .map((track, idx) => {
      const band = bands.find(b => b.id === track.bandId)
      if (!band) return null
      const djScore   = Math.floor(seededRandom(idx * 3 + 1) * DJ_SCORE_MULTIPLIER + idx * DJ_SCORE_BASE)
      const peerScore = Math.floor(seededRandom(idx * 3 + 2) * PEER_SCORE_MULTIPLIER + idx * PEER_SCORE_BASE)
      const compositeScore = (djScore * PILLAR_WEIGHT) + (peerScore * PILLAR_WEIGHT)
      return { band, track, compositeScore }
    })
    .filter((r): r is { band: Band; track: Track; compositeScore: number } => r !== null)
    .sort((a, b) => b.compositeScore - a.compositeScore)

  return entries[0] ?? null
}

export default function HomePage() {
  const topEntry = buildHeroEntry()
  const heroCoverArtUrl = topEntry?.track.coverArtUrl ?? topEntry?.band.coverArtUrl ?? null

  return (
    <main className="min-h-screen gradient-mesh">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden py-20 sm:py-28 px-4">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12 items-center">

          {/* Left: Brand + CTA */}
          <div>
            <p className="text-[11px] text-accent tracking-[0.3em] uppercase mb-4 font-medium">
              Fair Voting · Keine Pay-to-Win · Transparente Algorithmen
            </p>
            <h1 className="text-5xl md:text-7xl font-display text-white leading-none mb-6">
              DarkTunes<br />
              <span className="text-primary">Charts</span>
            </h1>
            <p className="text-base text-muted-foreground max-w-xl mb-8 leading-relaxed">
              Die fairsten Dark-Musik Charts der Welt. Fan-Stimmen, DJ-Expertise und Peer-Respekt
              bestimmen gemeinsam, wer die Szene anführt.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="h-10 px-6 text-[12px] uppercase tracking-widest rounded-sm">
                <Link href="/charts">Charts ansehen</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-10 px-6 text-[12px] uppercase tracking-widest border-white/15 text-white/70 hover:text-white hover:bg-white/5 rounded-sm"
              >
                <Link href="/vote">Jetzt abstimmen</Link>
              </Button>
            </div>
          </div>

          {/* Right: Featured #1 Preview Card */}
          {topEntry && (
            <div className="relative group">
              <div className="relative rounded-lg overflow-hidden border border-white/[0.08] aspect-square max-w-sm mx-auto">
                {heroCoverArtUrl ? (
                  <Image
                    src={getCachedImageUrl(heroCoverArtUrl, { width: 400, height: 400, fit: 'cover' }) ?? heroCoverArtUrl}
                    alt={`${topEntry.track.title} artwork`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    priority
                  />
                ) : (
                  <div className={`absolute inset-0 bg-gradient-to-br ${GENRE_GRADIENTS[topEntry.band.genre] ?? 'from-gray-900 to-black'}`} />
                )}
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-[10px] text-primary uppercase tracking-widest font-medium mb-1">#1 Charts</p>
                  <h3 className="font-display text-xl text-white leading-tight">{topEntry.track.title}</h3>
                  <p className="text-sm text-white/60">{topEntry.band.name}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Background accent */}
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-0 w-1/2 h-full opacity-20"
          style={{ background: 'radial-gradient(ellipse at 80% 40%, var(--dt-violet) 0%, transparent 70%)' }}
        />
      </section>

      {/* ── Live Top-5 Preview with Genre Filter ── */}
      <section className="py-12 px-4 border-t border-white/[0.05]">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display text-white tracking-wide">Aktuelle Charts</h2>
            <Link href="/charts" className="text-sm text-accent hover:text-accent/80 transition-colors">
              Alle ansehen →
            </Link>
          </div>
          <GenreFilteredTop5 bands={SEED_BANDS} tracks={SEED_TRACKS} />
        </div>
      </section>

      {/* ── 3 Emotional Pillars ── */}
      <section className="py-16 px-4 border-t border-white/[0.05]">
        <div className="max-w-[1440px] mx-auto">
          <h2 className="text-2xl font-display text-white mb-2 tracking-wide">3 Stimmen. 1 Chart. Null Pay-to-Win.</h2>
          <p className="text-sm text-muted-foreground mb-8">Jede Stimme zählt — unabhängig vom Budget.</p>
          <PillarCards />
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 px-4 border-t border-white/[0.05]">
        <div className="max-w-[1440px] mx-auto">
          <h2 className="text-2xl font-display text-white mb-3 tracking-wide">Mitmachen</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Als Fan abstimmen, als DJ Ballots einreichen, oder als Band registrieren.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              asChild
              variant="outline"
              className="h-9 px-5 text-[11px] uppercase tracking-widest border-white/12 text-white/60 hover:text-white hover:bg-white/5 rounded-sm"
            >
              <Link href="/vote">Als Fan abstimmen</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-9 px-5 text-[11px] uppercase tracking-widest border-white/12 text-white/60 hover:text-white hover:bg-white/5 rounded-sm"
            >
              <Link href="/transparency">Transparenz-Log</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
