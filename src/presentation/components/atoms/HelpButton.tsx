'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { HelpPanel } from '@/presentation/components/molecules/HelpPanel'

interface HelpButtonProps {
  /** Short title shown in the panel header. */
  title: string
  /** Full explanation text shown in the panel body. */
  description: string
  /** Optional ARIA label for the (?) button; falls back to i18n default. */
  ariaLabel?: string
}

/**
 * HelpButton — ISO 9241-110 Selbstbeschreibungsfähigkeit (Spec §8.1)
 *
 * A small circular (?) button that opens a slide-in HelpPanel with contextual
 * help text for complex UI elements (e.g. voting algorithms, tier system).
 * Designed to be placed inline, directly next to the element it explains.
 *
 * Accessibility:
 *   - HelpPanel uses role="dialog" + aria-modal + aria-label
 *   - The trigger button has an aria-label with the section name
 */
export function HelpButton({ title, description, ariaLabel }: HelpButtonProps) {
  const t = useTranslations('help')
  const resolvedAriaLabel = ariaLabel ?? t('defaultAriaLabel')
  const [open, setOpen] = useState(false)

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
        title={title}
        description={description}
      />
    </>
  )
}
