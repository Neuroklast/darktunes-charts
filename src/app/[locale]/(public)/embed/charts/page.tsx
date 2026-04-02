import type { Metadata } from 'next'
import { CATEGORY_DEFINITIONS } from '@/domain/categories'

export const metadata: Metadata = {
  title: 'DarkTunes Charts Widget',
  // Disable robots for embed pages
  robots: { index: false, follow: false },
}

interface PageProps {
  searchParams: Promise<{
    category?: string
    limit?: string
    theme?: string
  }>
}

/**
 * Embeddable chart widget — /embed/charts
 *
 * Iframe-friendly minimal chart view. Configurable via query params:
 * - ?category=overall  (default: overall)
 * - ?limit=10          (default: 10, max: 20)
 * - ?theme=dark        (default: dark)
 *
 * CORS headers to allow embedding are set in next.config.ts.
 * The page uses no external dependencies — minimal inline styles only.
 */
export default async function EmbedChartsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const categoryId = params.category ?? 'overall'
  const limit = Math.min(Math.max(Number(params.limit ?? 10), 1), 20)
  const theme = params.theme === 'light' ? 'light' : 'dark'

  const categoryName =
    CATEGORY_DEFINITIONS[categoryId as keyof typeof CATEGORY_DEFINITIONS]?.name ?? categoryId

  // Placeholder entries — replaced by real chart API data in production
  const entries = Array.from({ length: limit }, (_, i) => ({
    rank: i + 1,
    artist: `Artist ${i + 1}`,
    title: `Track ${i + 1}`,
    score: Math.round((500 - i * 12) * 10) / 10,
  }))

  const bg = theme === 'dark' ? '#0f0f0f' : '#ffffff'
  const text = theme === 'dark' ? '#ffffff' : '#0f0f0f'
  const muted = theme === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'
  const border = theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'

  return (
    <html lang="de">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { background: ${bg}; color: ${text}; font-family: system-ui, sans-serif; font-size: 13px; }
          .header { padding: 10px 12px; border-bottom: 1px solid ${border}; display: flex; justify-content: space-between; align-items: center; }
          .header-title { font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; font-size: 11px; }
          .header-link { color: ${muted}; font-size: 10px; text-decoration: none; }
          .entry { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-bottom: 1px solid ${border}; }
          .rank { width: 20px; text-align: right; color: ${muted}; font-size: 12px; font-weight: 700; }
          .info { flex: 1; min-width: 0; }
          .artist { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .title { color: ${muted}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 11px; margin-top: 1px; }
          .score { color: ${muted}; font-size: 11px; font-variant-numeric: tabular-nums; white-space: nowrap; }
          .footer { padding: 6px 12px; text-align: right; }
          .footer a { color: #7c3aed; font-size: 10px; text-decoration: none; }
        `}</style>
      </head>
      <body>
        <div className="header">
          <span className="header-title">DarkTunes · {categoryName}</span>
          <a href="https://darktunes.com/charts" target="_blank" rel="noopener noreferrer" className="header-link">
            darktunes.com ↗
          </a>
        </div>

        {entries.map((entry) => (
          <div key={entry.rank} className="entry">
            <span className="rank">{entry.rank}</span>
            <div className="info">
              <div className="artist">{entry.artist}</div>
              <div className="title">{entry.title}</div>
            </div>
            <span className="score">{entry.score}</span>
          </div>
        ))}

        <div className="footer">
          <a href="https://darktunes.com" target="_blank" rel="noopener noreferrer">
            Powered by DarkTunes
          </a>
        </div>
      </body>
    </html>
  )
}
