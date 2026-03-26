'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface HelpButtonProps {
  /** Short title shown in the dialog header. */
  title: string
  /** Full explanation text shown in the dialog body. */
  description: string
  /** Optional ARIA label for the (?) button; defaults to "Hilfe". */
  ariaLabel?: string
}

/**
 * HelpButton — ISO 9241-110 Selbstbeschreibungsfähigkeit (Spec §8.1)
 *
 * A small circular (?) button that opens a modal dialog with contextual
 * help text for complex UI elements (e.g. voting algorithms, tier system).
 * Designed to be placed inline, directly next to the element it explains.
 *
 * Accessibility:
 *   - Uses a Dialog with proper aria-labelledby / aria-describedby
 *   - The trigger button has an aria-label with the section name
 *   - Focus is managed automatically by Radix Dialog
 */
export function HelpButton({ title, description, ariaLabel = 'Hilfe' }: HelpButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted text-xs font-bold p-0 leading-none"
        onClick={() => setOpen(true)}
        aria-label={ariaLabel}
      >
        ?
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed mt-2 whitespace-pre-line">
              {description}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  )
}
