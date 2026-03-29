/**
 * Trial period configuration constants (Spec §3.1 extension).
 *
 * Bands exploring additional categories beyond their first free category
 * receive a 30-day trial before committing to a monthly subscription.
 * Financial contributions (including trial status) have ZERO effect on
 * chart ranking scores (Spec §3.2).
 */

/** Duration of the trial period in calendar days. */
export const TRIAL_PERIOD_DAYS = 30

/** Number of days before trial expiration to send a reminder notification. */
export const TRIAL_WARNING_DAYS = 7

/** Stripe subscription metadata key for trial flag. */
export const STRIPE_TRIAL_METADATA_KEY = 'is_trial'

/** Stripe subscription metadata value indicating an active trial. */
export const STRIPE_TRIAL_METADATA_VALUE = 'true'
