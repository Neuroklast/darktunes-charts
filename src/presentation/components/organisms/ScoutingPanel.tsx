'use client'

import { Zap, AlertTriangle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ScoutingSuggestion } from '@/domain/releases/index'

const REASON_LABEL: Record<ScoutingSuggestion['reason'], string> = {
  new_release: 'New Release',
  velocity_spike: 'Velocity ↑',
  genre_match: 'Genre Match',
}

const REASON_COLOR: Record<ScoutingSuggestion['reason'], string> = {
  new_release: '#7C3AED',
  velocity_spike: '#F59E0B',
  genre_match: '#00F0FF',
}

const DEMO_SUGGESTIONS: ScoutingSuggestion[] = [
  {
    spotifyTrackId: 'demo-1',
    spotifyArtistId: 'artist-1',
    artistName: 'Nachtblut',
    trackName: 'Asche zu Asche',
    genre: 'GOTH',
    spotifyMonthlyListeners: 45_200,
    releaseDate: '2025-06-01',
    artworkUrl: '',
    reason: 'velocity_spike',
    confidenceScore: 0.87,
  },
  {
    spotifyTrackId: 'demo-2',
    spotifyArtistId: 'artist-2',
    artistName: 'She Wants Revenge',
    trackName: 'Tear You Apart',
    genre: 'DARKWAVE',
    spotifyMonthlyListeners: 128_000,
    releaseDate: '2025-05-18',
    artworkUrl: '',
    reason: 'genre_match',
    confidenceScore: 0.74,
  },
  {
    spotifyTrackId: 'demo-3',
    spotifyArtistId: 'artist-3',
    artistName: 'Blutengel',
    trackName: 'Black Snow',
    genre: 'DARK_ELECTRO',
    spotifyMonthlyListeners: 210_000,
    releaseDate: '2025-06-10',
    artworkUrl: '',
    reason: 'new_release',
    confidenceScore: 0.91,
  },
]

interface ScoutingPanelProps {
  suggestions?: ScoutingSuggestion[]
}

/**
 * ScoutingPanel — Discovery Bot scouting suggestions for DJs and Admins.
 *
 * Displays AI-discovered tracks with confidence scores and nomination actions.
 * Falls back to demo data when no real suggestions are available.
 */
export function ScoutingPanel({ suggestions }: ScoutingPanelProps) {
  const items = suggestions && suggestions.length > 0 ? suggestions : DEMO_SUGGESTIONS
  const isDemo = !suggestions || suggestions.length === 0
  const tDemo = useTranslations('demo')

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Zap size={18} className="text-[#F59E0B]" />
        <h2
          className="text-xl font-bold uppercase tracking-wider text-white"
          style={{ fontFamily: 'Oswald, sans-serif' }}
        >
          Discovery Scouting
        </h2>
      </div>

      {isDemo && (
        <div
          role="status"
          className="flex items-center gap-2 px-3 py-2 rounded-sm border border-dashed border-[#F59E0B]/30 bg-[#F59E0B]/5 text-[#F59E0B] text-xs"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          <AlertTriangle size={14} className="shrink-0" aria-hidden="true" />
          <span>{tDemo('scoutingBanner')}</span>
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-white/40">
          Keine neuen Vorschläge — Bots scouten im Hintergrund.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((s) => (
            <div
              key={s.spotifyTrackId}
              className={`bg-[#141414] border rounded-xl p-4 flex flex-col gap-3 ${isDemo ? 'border-dashed border-white/[0.12] opacity-80' : 'border-white/[0.06]'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-white">{s.artistName}</p>
                  <p className="text-xs text-white/50">{s.trackName}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {/* Genre badge */}
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-white/60 uppercase tracking-wider">
                    {s.genre.replace(/_/g, ' ')}
                  </span>
                  {/* Reason badge */}
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider"
                    style={{ color: REASON_COLOR[s.reason], backgroundColor: `${REASON_COLOR[s.reason]}18`, border: `1px solid ${REASON_COLOR[s.reason]}40` }}
                  >
                    {REASON_LABEL[s.reason]}
                  </span>
                </div>
              </div>

              {/* Confidence bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/40">Konfidenz</span>
                  <span className="text-[10px] text-white/60 font-mono">{Math.round(s.confidenceScore * 100)}%</span>
                </div>
                <div className="w-full h-1 rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[#00F0FF]"
                    style={{ width: `${s.confidenceScore * 100}%` }}
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  // TODO: replace with real nomination API call (e.g. POST /api/nominations)
                  console.info('[ScoutingPanel] nominate stub:', s.spotifyTrackId)
                }}
                className="self-start text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              >
                Nominieren
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
