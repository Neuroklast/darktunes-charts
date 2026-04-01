import type { Metadata } from 'next'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Music2, ExternalLink } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Compilations · DarkTunes',
  description: 'Community-kuratierte Dark-Music-Compilations von DarkTunes.',
  openGraph: {
    title: 'DarkTunes Compilations',
    description: 'Community-kuratierte Dark-Music-Compilations.',
    type: 'music.album',
  },
}

/**
 * Placeholder compilation data — replaced by real Prisma data once
 * the compilation engine is fully wired up.
 */
const PLACEHOLDER_COMPILATIONS = [
  {
    id: '1',
    title: 'DarkTunes Vol. 1 — Into the Void',
    description: 'Die erste offizielle DarkTunes Compilation mit den Top-Tracks aus Q1 2026.',
    trackCount: 18,
    genres: ['Dark Electro', 'Gothic', 'Metal'],
    status: 'published' as const,
    spotifyUrl: null,
    coverArt: null,
  },
  {
    id: '2',
    title: 'DarkTunes Vol. 2 — Nachtschatten',
    description: 'Underground-Perlen und Community-Favoriten aus der DACH-Darkmusik-Szene.',
    trackCount: 20,
    genres: ['Post-Punk', 'Goth', 'Dark Ambient'],
    status: 'draft' as const,
    spotifyUrl: null,
    coverArt: null,
  },
]

export default function CompilationsPage() {
  return (
    <main className="min-h-screen bg-background py-8 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">

        {/* Page Header */}
        <div className="mb-8">
          <h1
            className="text-4xl font-display text-white mb-2"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}
          >
            Compilations
          </h1>
          <p className="text-sm text-white/40" style={{ fontFamily: 'var(--font-body)' }}>
            Community-kuratierte Dark-Music-Compilations · Vom Voting bis zur Playlist
          </p>
        </div>

        {/* Compilations Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {PLACEHOLDER_COMPILATIONS.map((compilation) => (
            <CompilationCard key={compilation.id} compilation={compilation} />
          ))}
        </div>

        {/* How it works */}
        <section className="mt-12 border border-white/[0.06] rounded-sm p-6 bg-[#141414]">
          <h2
            className="text-sm font-display text-white tracking-[0.14em] mb-3"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Wie entstehen Compilations?
          </h2>
          <ol className="space-y-2 text-sm text-white/50" style={{ fontFamily: 'var(--font-body)' }}>
            <li>1. Die Top-Releases aus den monatlichen Charts werden automatisch ausgewählt (60%).</li>
            <li>2. Ausgewählte DJs kuratieren die verbleibenden 40% als persönliche Picks.</li>
            <li>3. Die fertige Tracklist wird auf Spotify veröffentlicht und verlinkt.</li>
          </ol>
        </section>

      </div>
    </main>
  )
}

interface CompilationCardProps {
  compilation: {
    id: string
    title: string
    description: string
    trackCount: number
    genres: string[]
    status: 'published' | 'draft'
    spotifyUrl: string | null
    coverArt: string | null
  }
}

function CompilationCard({ compilation }: CompilationCardProps) {
  const isPublished = compilation.status === 'published'

  return (
    <Card className="bg-[#141414] border border-white/[0.06] p-6 flex flex-col gap-4">
      {/* Cover placeholder */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-sm bg-[#1a1a1a] border border-white/[0.06] flex items-center justify-center shrink-0">
          <Music2 size={24} className="text-white/20" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h2
              className="text-base font-display text-white truncate"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}
            >
              {compilation.title}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={isPublished ? 'default' : 'outline'}
              className="text-[10px] uppercase tracking-wider"
            >
              {isPublished ? 'Veröffentlicht' : 'In Bearbeitung'}
            </Badge>
            <span className="text-xs text-white/30" style={{ fontFamily: 'var(--font-body)' }}>
              {compilation.trackCount} Tracks
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-white/50 leading-relaxed" style={{ fontFamily: 'var(--font-body)' }}>
        {compilation.description}
      </p>

      {/* Genre tags */}
      <div className="flex flex-wrap gap-1.5">
        {compilation.genres.map((genre) => (
          <span
            key={genre}
            className="px-1.5 py-0.5 text-[10px] uppercase tracking-wider rounded-sm border border-[#7C3AED]/40 bg-[#7C3AED]/10 text-[#7C3AED]"
            style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
          >
            {genre}
          </span>
        ))}
      </div>

      {/* Actions */}
      {isPublished && (
        <div className="flex gap-2 pt-2 border-t border-white/[0.04]">
          {compilation.spotifyUrl ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={compilation.spotifyUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={14} className="mr-1.5 text-[#1DB954]" />
                Auf Spotify öffnen
              </Link>
            </Button>
          ) : (
            <span className="text-xs text-white/25 py-2" style={{ fontFamily: 'var(--font-body)' }}>
              Spotify-Sync ausstehend
            </span>
          )}
        </div>
      )}
    </Card>
  )
}
