'use client'

import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'

interface DemoBannerProps {
  /** The warning text to display. */
  message: string
  /** Accessible label for the dismiss button. */
  dismissLabel?: string
  /** Called when the banner is dismissed. */
  onDismiss?: () => void
}

/**
 * DemoBanner — Dismissible warning banner for demo/placeholder data.
 *
 * Renders a visually distinct amber/warning-colored banner that informs users
 * the displayed data is illustrative. Matches the Obsidian design system.
 */
export function DemoBanner({ message, dismissLabel = 'Dismiss', onDismiss }: DemoBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
  }

  return (
    <div
      role="status"
      className="flex items-center gap-3 px-4 py-2.5 rounded-sm border border-[#F59E0B]/30 bg-[#F59E0B]/10 text-[#F59E0B] text-sm"
      style={{ fontFamily: 'var(--font-body)' }}
    >
      <AlertTriangle size={16} className="shrink-0" aria-hidden="true" />
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={handleDismiss}
        className="shrink-0 p-1 rounded-sm hover:bg-[#F59E0B]/20 transition-colors"
        aria-label={dismissLabel}
      >
        <X size={14} />
      </button>
    </div>
  )
}
