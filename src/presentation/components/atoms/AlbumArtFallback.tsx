'use client'

import { Music2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AlbumArtFallbackProps {
  /** Width/height class, e.g. "w-10 h-10" or "w-12 h-12". */
  size?: string
  /** Additional CSS classes. */
  className?: string
}

/**
 * AlbumArtFallback — Obsidian gradient placeholder for missing album artwork.
 *
 * Replaces the previous emoji (🎵) fallback with a professional gradient
 * background and Music2 SVG icon, matching the Liquid Obsidian Design System.
 */
export function AlbumArtFallback({ size = 'w-10 h-10', className }: AlbumArtFallbackProps) {
  return (
    <div
      className={cn(
        'rounded flex items-center justify-center shrink-0',
        'bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]',
        size,
        className,
      )}
      aria-hidden="true"
    >
      <Music2 className="text-white/30" size={Math.min(20, 20)} />
    </div>
  )
}
