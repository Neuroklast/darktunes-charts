/**
 * Trial status calculation logic (pure functions).
 *
 * Computes the current state of a band's trial subscription
 * based on start date and configured trial duration. All functions
 * are side-effect-free and fully testable.
 *
 * CRITICAL: Trial status has ZERO influence on chart ranking scores (Spec §3.2).
 */

import { TRIAL_PERIOD_DAYS, TRIAL_WARNING_DAYS } from './trialConfig'

/** Possible states of a band's trial subscription. */
export type TrialPhase = 'active' | 'warning' | 'expired' | 'none'

/** Result of computing a trial's current status. */
export interface TrialStatusResult {
  /** Current phase of the trial lifecycle. */
  phase: TrialPhase
  /** Total number of days in the trial period. */
  totalDays: number
  /** Number of days remaining (0 when expired or no trial). */
  daysRemaining: number
  /** Number of days already elapsed since trial start. */
  daysElapsed: number
  /** Whether the trial warning threshold has been reached. */
  shouldNotify: boolean
  /** ISO-8601 date string of trial start (null when no trial). */
  startDate: string | null
  /** ISO-8601 date string of trial end (null when no trial). */
  endDate: string | null
}

/**
 * Calculates the full trial status for a band's subscription.
 *
 * Business rules:
 * - A trial lasts exactly {@link TRIAL_PERIOD_DAYS} days from the start date.
 * - The `warning` phase begins when {@link TRIAL_WARNING_DAYS} or fewer days remain.
 * - Once `daysRemaining` reaches 0 the trial is `expired`.
 * - If no `trialStartDate` is provided the phase is `none`.
 *
 * @param trialStartDate - ISO-8601 date string of when the trial began (or null).
 * @param now - Reference date for calculations (defaults to current date).
 * @returns Complete trial status with phase, countdown and notification flag.
 */
export function calculateTrialStatus(
  trialStartDate: string | null,
  now: Date = new Date()
): TrialStatusResult {
  if (!trialStartDate) {
    return {
      phase: 'none',
      totalDays: TRIAL_PERIOD_DAYS,
      daysRemaining: 0,
      daysElapsed: 0,
      shouldNotify: false,
      startDate: null,
      endDate: null,
    }
  }

  const start = new Date(trialStartDate)
  const end = new Date(start)
  end.setDate(end.getDate() + TRIAL_PERIOD_DAYS)

  const elapsedMs = now.getTime() - start.getTime()
  const daysElapsed = Math.floor(elapsedMs / (1000 * 60 * 60 * 24))
  const daysRemaining = Math.max(TRIAL_PERIOD_DAYS - daysElapsed, 0)

  let phase: TrialPhase
  if (daysRemaining === 0) {
    phase = 'expired'
  } else if (daysRemaining <= TRIAL_WARNING_DAYS) {
    phase = 'warning'
  } else {
    phase = 'active'
  }

  const shouldNotify = daysRemaining <= TRIAL_WARNING_DAYS && daysRemaining > 0

  return {
    phase,
    totalDays: TRIAL_PERIOD_DAYS,
    daysRemaining,
    daysElapsed,
    shouldNotify,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  }
}

/**
 * Determines whether a trial-based subscription should auto-convert to paid.
 *
 * @param trialStartDate - ISO-8601 date string of when the trial began (or null).
 * @param now - Reference date for calculations (defaults to current date).
 * @returns `true` when the trial period has fully elapsed.
 */
export function isTrialExpired(
  trialStartDate: string | null,
  now: Date = new Date()
): boolean {
  return calculateTrialStatus(trialStartDate, now).phase === 'expired'
}

/**
 * Builds Stripe subscription metadata entries for a new trial subscription.
 *
 * The returned record can be spread into Stripe's `metadata` field when
 * creating a checkout session or subscription.
 *
 * @param trialStartDate - ISO-8601 date string of the trial start.
 * @returns Metadata record suitable for Stripe API calls.
 */
export function buildTrialMetadata(trialStartDate: string): Record<string, string> {
  return {
    is_trial: 'true',
    trial_start: trialStartDate,
    trial_period_days: String(TRIAL_PERIOD_DAYS),
  }
}
