'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Dialog title. */
  title: string
  /** Body text explaining the action. */
  description: string
  /** Label for the confirm button (default: "Bestätigen"). */
  confirmLabel?: string
  /** Label for the cancel button (default: "Abbrechen"). */
  cancelLabel?: string
  /** Called when the user confirms the action. */
  onConfirm: () => void
}

/**
 * ConfirmDialog — Spec §8.1 Fehlertoleranz
 *
 * A modal alert dialog that requires explicit user confirmation before
 * an irreversible action (vote submission, mandate grant, track submission)
 * is executed.  Using AlertDialog instead of Dialog ensures the user must
 * actively dismiss it — it cannot be closed by clicking outside.
 *
 * Usage:
 * ```tsx
 * const [open, setOpen] = useState(false)
 * <ConfirmDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="Vote einreichen"
 *   description="Deine Stimme kann danach nicht mehr geändert werden."
 *   onConfirm={handleSubmit}
 * />
 * ```
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Bestätigen',
  cancelLabel = 'Abbrechen',
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>{confirmLabel}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
