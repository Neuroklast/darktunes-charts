'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { HelpPanel } from '@/presentation/components/molecules/HelpPanel'

interface HelpButtonProps {
  /** i18n key under the 'help' namespace (e.g. "fanVoting"). When provided, title/description/ariaLabel are loaded from translations. */
  helpKey?: string
  /** Short title shown in the panel header. Ignored when helpKey is provided. */
  title?: string
  /** Full explanation text shown in the panel body. Ignored when helpKey is provided. */
  description?: string
  /** Optional ARIA label override for the (?) button. */
  ariaLabel?: string
}

/**
 * HelpButton — ISO 9241-110 Selbstbeschreibungsfähigkeit (Spec §8.1)
 *
 * A small circular (?) button that opens a slide-in HelpPanel with contextual
 * help text for complex UI elements (e.g. voting algorithms, tier system).
 * Designed to be placed inline, directly next to the element it explains.
 *
 * Supports two usage patterns:
 *   1. `helpKey` — i18n key resolved via `useTranslations('help')` (preferred)
 *   2. `title` + `description` — direct string props (backward-compatible)
 *
 * Accessibility:
 *   - HelpPanel uses role="dialog" + aria-modal + aria-label
 *   - The trigger button has an aria-label with the section name
 */
export function HelpButton({ helpKey, title, description, ariaLabel }: HelpButtonProps) {
  const [open, setOpen] = useState(false)
  const t = useTranslations('help')

  const resolvedTitle = helpKey ? t(`${helpKey}.title`) : title ?? ''
  const resolvedDescription = helpKey ? t(`${helpKey}.description`) : description ?? ''
  const resolvedAriaLabel = ariaLabel ?? (helpKey ? t(`${helpKey}.ariaLabel`) : t('defaultAriaLabel'))

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted text-xs font-bold p-0 leading-none"
        onClick={() => setOpen(true)}
        aria-label={resolvedAriaLabel}
      >
        ?
      </Button>

      <HelpPanel
        open={open}
        onClose={() => setOpen(false)}
        title={resolvedTitle}
        description={resolvedDescription}
      />
    </>
  )
}
