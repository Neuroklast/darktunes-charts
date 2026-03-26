'use client'

import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface VoiceCreditSliderProps {
  /** Track title displayed above the slider. */
  trackTitle: string
  /** Current number of votes allocated to this track (0–10). */
  votes: number
  /** Credits spent (votes²) for the current allocation. */
  creditsSpent: number
  /** Maximum credits available (used for colour coding). */
  maxCredits: number
  /** Called when the slider value changes. */
  onChange: (votes: number) => void
  /** Whether the slider is disabled (e.g. budget exhausted). */
  disabled?: boolean
}

/** Quadratic cost for n votes: n² credits. */
function quadraticCost(n: number): number {
  return n * n
}

/**
 * VoiceCreditSlider molecule — Fan Voting UI component.
 *
 * Displays a track title with a drag slider (0–10 votes), real-time
 * credit cost indicator, and colour-coded feedback on budget usage.
 * Wraps the Radix Slider primitive with QV-specific business logic display.
 */
export function VoiceCreditSlider({
  trackTitle,
  votes,
  creditsSpent,
  maxCredits,
  onChange,
  disabled = false,
}: VoiceCreditSliderProps) {
  const cost = quadraticCost(votes)
  const usageRatio = maxCredits > 0 ? creditsSpent / maxCredits : 0
  const isOverBudget = usageRatio > 1

  return (
    <div className="space-y-2 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium truncate max-w-[60%]">{trackTitle}</span>
        <div className="flex items-center gap-2">
          <Badge
            variant={isOverBudget ? 'destructive' : 'secondary'}
            className="tabular-nums text-xs"
          >
            {votes}×  = {cost} Credits
          </Badge>
        </div>
      </div>

      <Slider
        min={0}
        max={10}
        step={1}
        value={[votes]}
        onValueChange={([value]) => onChange(value ?? 0)}
        disabled={disabled}
        className={cn(
          'w-full',
          isOverBudget && '[&_[role=slider]]:border-destructive'
        )}
        aria-label={`Stimmen für ${trackTitle}`}
      />
    </div>
  )
}
