'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Band, Track, Genre } from '@/lib/types'
import { seededRandom, GENRE_GRADIENTS } from '@/lib/utils'
import { getCachedImageUrl } from '@/lib/imageCache'

type ChartFilter = 'all' | Genre

const GENRE_TABS: { value: ChartFilter; label: string }[] = [
  { value: 'all',          label: 'Alle' },
  { value: 'Dark Electro', label: 'Dark Electro' },
  { value: 'Metal',        label: 'Metal' },
  { value: 'Goth',         label: 'Gothic' },
]

/** DJ and Peer score range constants — mirror those in ChartsView. */
const DJ_SCORE_MULTIPLIER   = 30
const DJ_SCORE_BASE         = 5
const PEER_SCORE_MULTIPLIER = 20
const PEER_SCORE_BASE       = 3
const PILLAR_WEIGHT         = 0.333

interface ChartEntry {
  band: Band
  track: Track
  compositeScore: number
}

function buildFilteredTop5(
  tracks: readonly Track[],
  bands: readonly Band[],
  filter: ChartFilter,
): ChartEntry[] {
  const filtered = filter === 'all'
    ? tracks
    : tracks.filter(t => {
        const band = bands.find(b => b.id === t.bandId)
        return band?.genre === filter
      })

  return filtered
    .slice(0, 30)
    .map((track, idx) => {
      const band = bands.find(b => b.id === track.bandId)
      if (!band) return null
      const djScore   = Math.floor(seededRandom(idx * 3 + 1) * DJ_SCORE_MULTIPLIER + idx * DJ_SCORE_BASE)
      const peerScore = Math.floor(seededRandom(idx * 3 + 2) * PEER_SCORE_MULTIPLIER + idx * PEER_SCORE_BASE)
      const compositeScore = (djScore * PILLAR_WEIGHT) + (peerScore * PILLAR_WEIGHT)
      return { band, track, compositeScore }
    })
    .filter((r): r is ChartEntry => r !== null)
    .sort((a, b) => b.compositeScore - a.compositeScore)
    .slice(0, 5)
}

interface GenreFilteredTop5Props {
  bands: readonly Band[]
  tracks: readonly Track[]
}

/**
 * GenreFilteredTop5 — Interactive genre-filtered chart preview for the home page.
 *
 * Renders genre-filter tabs (All / Dark Electro / Metal / Gothic) and shows
 * the top 5 chart entries for the selected genre. Uses client-side state so
 * filtering is instant without a page reload.
 */
export default function GenreFilteredTop5({ bands, tracks }: GenreFilteredTop5Props) {
  const [activeFilter, setActiveFilter] = useState<ChartFilter>('all')

  const top5 = useMemo(
    () => buildFilteredTop5(tracks, bands, activeFilter),
    [tracks, bands, activeFilter],
  )

  return (
    <div>
      {/* Genre filter tabs */}
      <div className="flex items-center gap-1 mb-5 flex-wrap">
        {GENRE_TABS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setActiveFilter(value)}
            className={[
              'h-7 px-3 text-[11px] uppercase tracking-widest rounded-sm font-medium transition-all duration-150',
              activeFilter === value
                ? 'bg-primary text-white'
                : 'text-white/50 hover:text-white hover:bg-white/5 border border-white/10',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Top-5 grid */}
      {top5.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          Keine Tracks für dieses Genre vorhanden.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {top5.map((entry, i) => (
            <TopChartCard key={entry.track.id} entry={entry} rank={i} />
          ))}
        </div>
      )}
    </div>
  )
}

function TopChartCard({ entry, rank }: { entry: ChartEntry; rank: number }) {
  const artworkSrc = entry.track.coverArtUrl ?? entry.band.coverArtUrl ?? entry.band.logoUrl ?? null
  return (
    <Link
      href="/charts"
      className="group relative block rounded-md overflow-hidden aspect-square border border-white/[0.07] hover:border-white/20 transition-colors"
    >
      {artworkSrc ? (
        <Image
          src={getCachedImageUrl(artworkSrc, { width: 200, height: 200, fit: 'cover' }) ?? artworkSrc}
          alt={`${entry.track.title} artwork`}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${GENRE_GRADIENTS[entry.band.genre] ?? 'from-gray-900 to-black'}`} />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
      {/* Rank badge */}
      <div className="absolute top-2 left-2 w-6 h-6 rounded-sm flex items-center justify-center text-xs font-display font-bold bg-primary/80 text-white">
        {rank + 1}
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-2">
        <p className="text-[10px] font-display text-white leading-tight truncate">{entry.track.title}</p>
        <p className="text-[9px] text-white/50 truncate">{entry.band.name}</p>
      </div>
    </Link>
  )
}
