/**
 * Trial expiration notification service.
 *
 * Responsible for sending reminder emails when a band's trial subscription
 * is approaching expiration. In production this would integrate with an
 * email provider (e.g. Resend, SendGrid). The current implementation
 * provides the interface and a stub that logs notifications.
 *
 * CRITICAL: Notification logic has ZERO influence on chart ranking (Spec §3.2).
 */

import { TRIAL_WARNING_DAYS } from '@/domain/payment/trialConfig'

/** Payload for a trial expiration reminder email. */
export interface TrialExpirationNotification {
  /** UUID of the band whose trial is expiring. */
  bandId: string
  /** Email address to send the notification to. */
  email: string
  /** Number of days remaining in the trial. */
  daysRemaining: number
  /** ISO-8601 date string of trial end. */
  trialEndDate: string
}

/** Result of attempting to send a notification. */
export interface NotificationResult {
  success: boolean
  message: string
}

/**
 * Sends a trial expiration reminder email.
 *
 * Called when a band's trial enters the warning phase
 * ({@link TRIAL_WARNING_DAYS} days or fewer remaining).
 *
 * In production, replace the stub implementation with your email provider.
 *
 * @param notification - Notification payload with band and email details.
 * @returns Result indicating whether the notification was dispatched.
 */
export async function sendTrialExpirationReminder(
  notification: TrialExpirationNotification
): Promise<NotificationResult> {
  const { bandId, email, daysRemaining, trialEndDate } = notification

  if (!email) {
    return { success: false, message: 'No email address provided' }
  }

  if (daysRemaining > TRIAL_WARNING_DAYS) {
    return { success: false, message: 'Trial is not yet in warning phase' }
  }

  // Production integration point:
  // await resend.emails.send({
  //   from: 'DarkTunes Charts <noreply@darktunes.com>',
  //   to: email,
  //   subject: `Your trial expires in ${daysRemaining} days`,
  //   html: renderTrialExpirationEmail({ bandId, daysRemaining, trialEndDate }),
  // })

  console.info(
    `[TrialNotification] Reminder sent to ${email} for band ${bandId}: ` +
    `${daysRemaining} day(s) remaining (ends ${trialEndDate})`
  )

  return {
    success: true,
    message: `Trial expiration reminder sent: ${daysRemaining} day(s) remaining`,
  }
}
