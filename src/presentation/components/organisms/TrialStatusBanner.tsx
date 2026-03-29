'use client'

import { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { calculateTrialStatus, type TrialPhase } from '@/domain/payment/trialStatus'
import { cn } from '@/lib/utils'

interface TrialStatusBannerProps {
  /** ISO-8601 date string of when the trial began (null if no trial). */
  trialStartDate: string | null
}

/** Maps trial phase to visual styling. */
const PHASE_STYLES: Record<TrialPhase, { badge: string; border: string; label: string }> = {
  active: {
    badge: 'bg-accent text-accent-foreground',
    border: 'border-accent/30',
    label: 'Trial Active',
  },
  warning: {
    badge: 'bg-yellow-500/80 text-black',
    border: 'border-yellow-500/30',
    label: 'Trial Ending Soon',
  },
  expired: {
    badge: 'bg-destructive text-white',
    border: 'border-destructive/30',
    label: 'Trial Expired',
  },
  none: {
    badge: '',
    border: '',
    label: '',
  },
}

/**
 * TrialStatusBanner — Displays current trial subscription status.
 *
 * Shows a countdown of days remaining in the band's trial period,
 * a progress bar, and phase-appropriate styling (active / warning / expired).
 *
 * Trial status has ZERO influence on chart ranking scores (Spec §3.2).
 */
export function TrialStatusBanner({ trialStartDate }: TrialStatusBannerProps) {
  const status = useMemo(() => calculateTrialStatus(trialStartDate), [trialStartDate])

  if (status.phase === 'none') {
    return null
  }

  const style = PHASE_STYLES[status.phase]
  const progressPercent = Math.round((status.daysElapsed / status.totalDays) * 100)

  return (
    <Card className={cn('p-4 glassmorphism', style.border)} data-testid="trial-status-banner">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg" role="img" aria-label="trial">⏳</span>
          <h4 className="font-display font-semibold text-sm">Free Trial</h4>
        </div>
        <Badge className={cn('text-xs', style.badge)}>{style.label}</Badge>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Day {status.daysElapsed} of {status.totalDays}</span>
          <span className="font-mono font-bold text-foreground">
            {status.daysRemaining} {status.daysRemaining === 1 ? 'day' : 'days'} remaining
          </span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {status.phase === 'active' && (
        <p className="text-xs text-muted-foreground">
          Enjoy full access to your additional categories. Your trial ends on{' '}
          <span className="font-mono text-foreground">
            {status.endDate ? new Date(status.endDate).toLocaleDateString() : '—'}
          </span>.
        </p>
      )}

      {status.phase === 'warning' && (
        <p className="text-xs text-yellow-400">
          ⚠️ Your trial expires in <strong>{status.daysRemaining} day(s)</strong>. After that,
          your subscription will automatically convert to a paid plan.
        </p>
      )}

      {status.phase === 'expired' && (
        <p className="text-xs text-destructive">
          Your trial has ended. Your subscription is now active at the standard rate.
        </p>
      )}
    </Card>
  )
}
