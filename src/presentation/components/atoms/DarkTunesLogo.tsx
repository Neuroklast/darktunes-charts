import Image from 'next/image'

/**
 * DarkTunesLogo — Brand mark using the official DarkTunes skull-with-headphones logo.
 *
 * Uses the PNG asset from /public/logo.png alongside the wordmark.
 * The logo depicts a skull wearing headphones with devil horns and a cross —
 * the official DarkTunes Music Group identity.
 */
export function DarkTunesLogo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ''}`}>
      <Image
        src="/logo.png"
        alt="DarkTunes skull-with-headphones logo"
        width={36}
        height={36}
        className="object-contain"
        priority
      />

      {/* Wordmark */}
      <div className="flex flex-col leading-none">
        <span
          className="text-white font-display text-base tracking-widest"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.12em', textTransform: 'none' }}
        >
          dark<span className="text-white font-bold">TUNES</span>
        </span>
        <span className="text-[10px] text-white/40 tracking-[0.2em] uppercase" style={{ fontFamily: 'var(--font-body)' }}>
          Music Group
        </span>
      </div>
    </div>
  )
}
