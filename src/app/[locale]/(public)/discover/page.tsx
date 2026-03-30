'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { SEED_BANDS } from '@/lib/seedData'
import { getCachedImageUrl } from '@/lib/imageCache'
import { getCountryFlag, getTierBadgeVariant, GENRE_GRADIENTS } from '@/lib/utils'
import type { Band, Genre } from '@/lib/types'

const GENRE_FILTERS: Array<{ value: 'all' | Genre; label: string }> = [
  { value: 'all',          label: 'Alle' },
  { value: 'Goth',         label: 'Gothic' },
  { value: 'Metal',        label: 'Metal' },
  { value: 'Dark Electro', label: 'Dark Electro' },
]

/**
 * Discover page — visual grid of all bands grouped by genre.
 *
 * Provides genre-filter tabs and links to individual band profile pages.
 * Uses seed data with genre-specific gradient fallbacks when no artwork exists.
 */
export default function DiscoverPage() {
  const [activeGenre, setActiveGenre] = useState<'all' | Genre>('all')

  const bands = useMemo(() => {
    const all = SEED_BANDS as Band[]
    if (activeGenre === 'all') return all
    return all.filter(b => b.genre === activeGenre)
  }, [activeGenre])

  return (
    <main className="min-h-screen gradient-mesh">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-white tracking-tight mb-2">Entdecken</h1>
          <p className="text-muted-foreground text-sm">
            {bands.length} Bands aus der Dark-Music-Szene · Klicke auf eine Band für ihr Profil
          </p>
        </div>

        {/* Genre filter tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {GENRE_FILTERS.map(filter => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setActiveGenre(filter.value)}
              className={[
                'px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
                activeGenre === filter.value
                  ? 'bg-primary text-white'
                  : 'bg-secondary/40 text-muted-foreground hover:bg-secondary/70 hover:text-foreground',
              ].join(' ')}
              aria-pressed={activeGenre === filter.value}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Band grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {bands.map(band => (
            <BandCard key={band.id} band={band} />
          ))}
        </div>
      </div>
    </main>
  )
}

function BandCard({ band }: { band: Band }) {
  const artworkSrc = band.coverArtUrl ?? band.logoUrl ?? null
  const gradient   = GENRE_GRADIENTS[band.genre] ?? 'from-gray-900 to-black'
  const flag       = band.country ? getCountryFlag(band.country) : ''

  return (
    <Link
      href={`/band/${band.id}`}
      className="group relative block rounded-md overflow-hidden border border-white/[0.07] hover:border-white/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
      aria-label={`${band.name} Profil ansehen`}
    >
      {/* Square artwork */}
      <div className="relative aspect-square">
        {artworkSrc ? (
          <Image
            src={getCachedImageUrl(artworkSrc, { width: 200, height: 200, fit: 'cover' }) ?? artworkSrc}
            alt={`${band.name} artwork`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

        {/* Tier badge */}
        <div className="absolute top-2 right-2">
          <Badge variant={getTierBadgeVariant(band.tier)} className="text-[9px] px-1 py-0">
            {band.tier}
          </Badge>
        </div>
      </div>

      {/* Info overlay */}
      <div className="p-3 bg-card/80 backdrop-blur-sm">
        <p className="text-xs font-display font-semibold text-white truncate">
          {flag && <span className="mr-1">{flag}</span>}
          {band.name}
        </p>
        <p className="text-[10px] text-muted-foreground truncate">{band.genre}</p>
        <p className="text-[10px] font-mono text-muted-foreground/60 mt-0.5">
          {band.spotifyMonthlyListeners.toLocaleString('de-DE')} Listener
        </p>
      </div>
    </Link>
  )
}
