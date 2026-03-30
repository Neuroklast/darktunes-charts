'use client'

import { useState, useCallback, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { VoiceCreditSlider } from '@/presentation/components/molecules/VoiceCreditSlider'
import { HelpButton } from '@/presentation/components/atoms/HelpButton'
import { ConfirmDialog } from '@/presentation/components/molecules/ConfirmDialog'
import { OnboardingTour } from '@/presentation/components/molecules/OnboardingTour'
import {
  saveFanVoteDraft,
  loadFanVoteDraft,
  clearFanVoteDraft,
} from '@/domain/voting/draftPersistence'
import { toast } from 'sonner'

export interface FanTrack {
  id: string
  title: string
  artist: string
}

interface FanVotingPanelProps {
  /** Tracks shuffled via shuffle.ts for fairness (Spec §3.2). */
  tracks: FanTrack[]
  /** Total voice credit budget (default 100). */
  totalBudget?: number
  /** Authenticated voter ID for draft persistence. */
  voterId: string
  /** Voting period ID for draft scoping. */
  periodId: string
  /** Called with final allocations { trackId: votes } on submit. */
  onSubmit: (allocations: Record<string, number>) => Promise<void>
}

/** Quadratic cost for n votes. */
function quadraticCost(n: number): number {
  return n * n
}

const FAN_HELP = {
  title: 'Warum steigen die Kosten?',
  description:
    'Quadratic Voting lässt dich Intensität ausdrücken, ohne Minderheiten zu überwältigen.\n\nDie Kosten für n Stimmen auf denselben Track betragen n² Credits:\n• 1 Stimme = 1 Credit\n• 2 Stimmen = 4 Credits\n• 3 Stimmen = 9 Credits\n• 5 Stimmen = 25 Credits\n\nDu kannst deine 100 Credits breiter streuen oder intensiv auf einen Track setzen — aber extremes Bündeln wird teuer.',
}

const FAN_TOUR_STEPS = [
  { title: 'Welcome to Fan Voting!', description: 'Use Quadratic Voting to support your favourite dark music tracks.' },
  { title: 'Your Voice Credit Budget', description: 'You have 100 credits per month. The cost of n votes = n² credits.' },
  { title: 'Adjust Your Votes', description: 'Move sliders to allocate credits. Spreading votes is more efficient than concentrating them.' },
  { title: 'Submit Your Votes', description: 'Save a draft anytime, then submit when ready. Submissions are final.' },
]

/**
 * FanVotingPanel — Interactive fan voting UI (Spec §9.1).
 *
 * Features:
 * - VoiceCreditSlider per track with real-time budget display
 * - Running total showing Σ(votes²) and remaining credits
 * - Draft persistence (pause & resume)
 * - ConfirmDialog before final submission
 * - HelpButton explaining QV cost curve
 */
export function FanVotingPanel({
  tracks,
  totalBudget = 100,
  voterId,
  periodId,
  onSubmit,
}: FanVotingPanelProps) {
  // Load draft allocations on first render
  const [allocations, setAllocations] = useState<Record<string, number>>(() => {
    const draft = loadFanVoteDraft(voterId, periodId)
    if (draft) return draft.allocations
    return Object.fromEntries(tracks.map((t) => [t.id, 0]))
  })

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const creditsSpent = useMemo(
    () => Object.values(allocations).reduce((sum, v) => sum + quadraticCost(v), 0),
    [allocations]
  )

  const creditsRemaining = totalBudget - creditsSpent
  const isOverBudget = creditsRemaining < 0

  const handleVoteChange = useCallback(
    (trackId: string, votes: number) => {
      setAllocations((prev) => {
        const next = { ...prev, [trackId]: votes }
        const newSpent = Object.values(next).reduce((sum, v) => sum + quadraticCost(v), 0)
        if (newSpent > totalBudget) return prev // Reject over-budget changes
        return next
      })
    },
    [totalBudget]
  )

  const handleSaveDraft = useCallback(() => {
    saveFanVoteDraft(voterId, {
      periodId,
      allocations,
      savedAt: new Date().toISOString(),
    })
    toast.success('Entwurf gespeichert', {
      description: 'Dein Voting-Entwurf wurde gespeichert.',
    })
  }, [voterId, periodId, allocations])

  const handleReset = useCallback(() => {
    setAllocations(Object.fromEntries(tracks.map((t) => [t.id, 0])))
    clearFanVoteDraft(voterId, periodId)
    setResetConfirmOpen(false)
  }, [tracks, voterId, periodId])

  const handleConfirmSubmit = useCallback(async () => {
    setIsSubmitting(true)
    try {
      await onSubmit(allocations)
      clearFanVoteDraft(voterId, periodId)
    } finally {
      setIsSubmitting(false)
      setConfirmOpen(false)
    }
  }, [onSubmit, allocations, voterId, periodId])

  if (tracks.length === 0) {
    return (
      <Card className="p-8 glassmorphism text-center">
        <p className="text-muted-foreground">Keine Tracks zur Bewertung verfügbar.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Onboarding tour for first-time visitors */}
      <OnboardingTour
        storageKey="fan-voting"
        steps={FAN_TOUR_STEPS}
        skipLabel="Skip Tour"
        nextLabel="Next"
        finishLabel="Got it!"
      />

      {/* Budget display */}
      <Card className="p-4 glassmorphism">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Voice Credits</span>
            <HelpButton
              title={FAN_HELP.title}
              description={FAN_HELP.description}
              ariaLabel="Hilfe zu Quadratic Voting"
            />
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="tabular-nums">
              Σ(n²) = {creditsSpent}
            </Badge>
            <Badge
              variant={isOverBudget ? 'destructive' : creditsRemaining < 20 ? 'secondary' : 'default'}
              className="tabular-nums"
              role={isOverBudget ? 'alert' : undefined}
              aria-live="polite"
            >
              {creditsRemaining >= 0 ? `${creditsRemaining} verbleibend` : 'Budget überschritten!'}
            </Badge>
          </div>
        </div>

        {/* Budget bar */}
        <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden" aria-hidden="true">
          <div
            className={`h-full rounded-full transition-all ${isOverBudget ? 'bg-destructive' : 'bg-primary'}`}
            style={{ width: `${Math.min(100, (creditsSpent / totalBudget) * 100)}%` }}
          />
        </div>
      </Card>

      {/* Track sliders */}
      <div className="space-y-2" role="group" aria-label="Stimmen auf Tracks verteilen">
        {tracks.map((track) => (
          <VoiceCreditSlider
            key={track.id}
            trackTitle={`${track.title} — ${track.artist}`}
            votes={allocations[track.id] ?? 0}
            creditsSpent={creditsSpent}
            maxCredits={totalBudget}
            onChange={(votes) => handleVoteChange(track.id, votes)}
            disabled={isSubmitting}
          />
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSaveDraft}
          disabled={isSubmitting}
          aria-label="Entwurf speichern und später fortfahren"
        >
          Entwurf speichern
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setResetConfirmOpen(true)}
          disabled={isSubmitting}
          aria-label="Alle Votes zurücksetzen"
        >
          Zurücksetzen
        </Button>

        <Button
          onClick={() => setConfirmOpen(true)}
          disabled={isSubmitting || isOverBudget || creditsSpent === 0}
          aria-label="Votes endgültig einreichen"
          className="ml-auto"
        >
          {isSubmitting ? 'Wird eingereicht…' : 'Votes einreichen'}
        </Button>
      </div>

      {/* Submit confirmation */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Votes einreichen"
        description={`Du gibst ${creditsSpent} von ${totalBudget} Credits aus. Diese Aktion kann nicht rückgängig gemacht werden.`}
        confirmLabel="Ja, einreichen"
        cancelLabel="Abbrechen"
        onConfirm={handleConfirmSubmit}
      />

      {/* Reset confirmation */}
      <ConfirmDialog
        open={resetConfirmOpen}
        onOpenChange={setResetConfirmOpen}
        title="Alle Votes zurücksetzen?"
        description="Alle Slider werden auf 0 zurückgesetzt. Der gespeicherte Entwurf wird ebenfalls gelöscht."
        confirmLabel="Zurücksetzen"
        cancelLabel="Abbrechen"
        onConfirm={handleReset}
      />
    </div>
  )
}
