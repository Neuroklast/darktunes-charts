/**
 * Bot Detection Configuration
 *
 * Centralized configuration for bot detection heuristics and thresholds.
 * All values can be tuned based on production telemetry and false positive rates.
 *
 * These thresholds are designed to catch coordinated manipulation while minimizing
 * false positives for legitimate users.
 */

export const BOT_DETECTION_CONFIG = {
  /**
   * Burst Voting Detection
   * Maximum votes allowed per unique IP within the burst window.
   */
  BURST_VOTE_THRESHOLD: 10,

  /**
   * Burst Voting Detection
   * Time window for burst detection in milliseconds (5 minutes).
   */
  BURST_WINDOW_MS: 5 * 60 * 1000,

  /**
   * Identical Ballots Detection
   * Minimum identical ballots to flag as suspicious.
   * Identical ballot patterns are a strong signal of coordinated voting.
   */
  IDENTICAL_BALLOT_THRESHOLD: 3,

  /**
   * New Account Detection
   * Account age threshold in milliseconds — accounts younger than this are considered new.
   * Default: 24 hours
   */
  NEW_ACCOUNT_AGE_MS: 24 * 60 * 60 * 1000,

  /**
   * New Account Detection
   * Minimum new-account votes to trigger a mass-voting alert.
   */
  NEW_ACCOUNT_VOTE_THRESHOLD: 5,

  /**
   * Time-of-Day Anomaly Detection
   * Night-time voting anomaly window (UTC hours 02:00–04:00).
   * Voting activity concentrated in these hours is atypical for most locales.
   */
  ANOMALY_HOUR_START: 2,
  ANOMALY_HOUR_END: 4,

  /**
   * Time-of-Day Anomaly Detection
   * Minimum clustered night-time votes to trigger a time anomaly alert.
   */
  NIGHT_VOTE_THRESHOLD: 8,

  /**
   * Severity Escalation
   * Multiplier for determining critical vs high severity.
   * If vote count exceeds THRESHOLD * CRITICAL_MULTIPLIER, severity escalates.
   */
  CRITICAL_MULTIPLIER: 2,
} as const

/**
 * Type for accessing config values in a type-safe manner.
 */
export type BotDetectionConfig = typeof BOT_DETECTION_CONFIG
