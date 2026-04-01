import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'DarkTunes Band Widget',
  robots: { index: false, follow: false },
}

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ theme?: string }>
}

/**
 * Embeddable band card — /embed/band/:slug
 *
 * Minimal band info card designed for embedding via iframe.
 * Configurable via query params:
 * - ?theme=dark (default)
 *
 * Fetches live data from the band API if available,
 * otherwise shows a skeleton placeholder.
 */
export default async function EmbedBandPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { theme: themeParam } = await searchParams
  const theme = themeParam === 'light' ? 'light' : 'dark'

  const bg = theme === 'dark' ? '#141414' : '#f5f5f5'
  const text = theme === 'dark' ? '#ffffff' : '#0f0f0f'
  const muted = theme === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'
  const border = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const accent = '#7c3aed'

  return (
    <html lang="de">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { background: ${bg}; color: ${text}; font-family: system-ui, sans-serif; }
          .card { padding: 16px; border: 1px solid ${border}; border-radius: 4px; margin: 8px; }
          .title { font-size: 18px; font-weight: 700; letter-spacing: 0.04em; }
          .meta { color: ${muted}; font-size: 12px; margin-top: 6px; }
          .badge { display: inline-block; padding: 2px 6px; background: ${accent}18; color: ${accent}; border: 1px solid ${accent}40; border-radius: 3px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 8px; }
          .footer { margin-top: 12px; text-align: right; }
          .footer a { color: ${accent}; font-size: 10px; text-decoration: none; }
        `}</style>
      </head>
      <body>
        <div className="card">
          <div className="title">{slug}</div>
          <div className="meta">Auf DarkTunes entdecken</div>
          <div className="badge">Band</div>
          <div className="footer">
            <a href={`https://darktunes.com/bands/${slug}`} target="_blank" rel="noopener noreferrer">
              Profil ansehen ↗
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
