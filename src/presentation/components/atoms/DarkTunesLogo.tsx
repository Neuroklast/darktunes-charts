/**
 * DarkTunesLogo — Inline SVG brand mark
 *
 * Renders the skull-with-headphones icon alongside the darkTUNES wordmark.
 * The icon is adapted from the brand identity shown in the reference design.
 * Uses only SVG so no external image dependency is needed.
 */
export function DarkTunesLogo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ''}`}>
      {/* Skull + headphones icon */}
      <svg
        width="36"
        height="36"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Horns */}
        <path d="M18 38 Q10 10 28 18" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <path d="M82 38 Q90 10 72 18" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        {/* Skull head */}
        <ellipse cx="50" cy="52" rx="28" ry="26" fill="white" />
        {/* Jaw */}
        <rect x="36" y="68" width="28" height="10" rx="3" fill="white" />
        {/* Jaw teeth gaps */}
        <rect x="43" y="69" width="4" height="8" rx="1" fill="#0A0A0A" />
        <rect x="53" y="69" width="4" height="8" rx="1" fill="#0A0A0A" />
        {/* Eyes */}
        <ellipse cx="40" cy="50" rx="6" ry="7" fill="#0A0A0A" />
        <ellipse cx="60" cy="50" rx="6" ry="7" fill="#0A0A0A" />
        {/* Nose */}
        <path d="M47 60 L50 56 L53 60 Z" fill="#0A0A0A" />
        {/* Headphones arc */}
        <path d="M22 48 Q22 20 50 20 Q78 20 78 48" stroke="#0A0A0A" strokeWidth="4" fill="none" strokeLinecap="round" />
        {/* Headphone cups */}
        <rect x="15" y="45" width="10" height="14" rx="4" fill="#0A0A0A" stroke="white" strokeWidth="1.5" />
        <rect x="75" y="45" width="10" height="14" rx="4" fill="#0A0A0A" stroke="white" strokeWidth="1.5" />
        {/* Cross on forehead */}
        <line x1="50" y1="30" x2="50" y2="42" stroke="#0A0A0A" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="44" y1="36" x2="56" y2="36" stroke="#0A0A0A" strokeWidth="2.5" strokeLinecap="round" />
      </svg>

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
