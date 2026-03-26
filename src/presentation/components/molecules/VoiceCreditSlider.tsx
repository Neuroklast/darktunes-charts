'use client'

import { motion, useReducedMotion } from 'framer-motion'
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

/** Derives bar color from remaining budget ratio (green → amber → red). */
function budgetBarColor(remainingPercent: number): string {
  if (remainingPercent > 50) return '#00FF66'
  if (remainingPercent > 20) return '#F59E0B'
  return '#D30000'
}

/**
 * VoiceCreditSlider molecule — Fan Voting UI component.
 *
 * Displays a track title with a drag slider (0–10 votes), an animated
 * budget bar showing remaining credits, and colour-coded feedback.
 * Budget bar color shifts green → amber → red as credits deplete.
 * All animations respect prefers-reduced-motion (WCAG 2.1 SC 2.3.3).
 */
export function VoiceCreditSlider({
  trackTitle,
  votes,
  creditsSpent,
  maxCredits,
  onChange,
  disabled = false,
}: VoiceCreditSliderProps) {
  const shouldReduceMotion = useReducedMotion()
  const cost = quadraticCost(votes)
  const usageRatio = maxCredits > 0 ? creditsSpent / maxCredits : 0
  const isOverBudget = usageRatio > 1
  const remainingPercent = maxCredits > 0
    ? Math.max(0, ((maxCredits - creditsSpent) / maxCredits) * 100)
    : 0

  return (
    <div className="space-y-2 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium truncate max-w-[60%]">{trackTitle}</span>
        <Badge
          variant={isOverBudget ? 'destructive' : 'secondary'}
          className="tabular-nums text-xs"
        >
          {votes}× = {cost} Credits
        </Badge>
      </div>

      {/* Animated budget bar */}
      <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: budgetBarColor(remainingPercent) }}
          animate={shouldReduceMotion ? undefined : { width: `${remainingPercent}%` }}
          initial={false}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>

      <Slider
        min={0}
        max={10}
        step={1}
        value={[votes]}
        onValueChange={([value]) => onChange(value ?? 0)}
        disabled={disabled}
        className={cn('w-full', isOverBudget && '[&_[role=slider]]:border-destructive')}
        aria-label={`Stimmen für ${trackTitle}`}
      />

      {/* QV cost label */}
      <p className="text-[11px] text-white/40 font-mono">
        {votes} Votes = {votes}² = {cost} Credits
      </p>
    </div>
  )
}

