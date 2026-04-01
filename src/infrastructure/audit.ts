/**
 * @module infrastructure/audit
 *
 * Audit logging service for DarkTunes Charts.
 *
 * Every vote, ballot, computation, and chart publication is logged here
 * to provide a full transparency trail. Logs are stored in the AuditLog
 * table and can be queried by entity type/ID for public transparency reports.
 *
 * Logging is fire-and-forget: failures are caught and logged to console
 * so they never block the main operation flow.
 */
import { prisma } from '@/lib/prisma'

export type AuditAction =
  | 'fan_vote_submitted'
  | 'dj_ballot_submitted'
  | 'chart_computed'
  | 'chart_published'
  | 'dj_application_submitted'
  | 'dj_application_approved'
  | 'dj_application_rejected'
  | 'user_registered'
  | 'subscription_created'
  | 'subscription_cancelled'
  | 'compilation_created'
  | 'compilation_chart_tracks_selected'
  | 'compilation_curators_selected'
  | 'compilation_finalized'
  | 'compilation_published'
  | 'community_award_created'
  | 'award_nominations_closed'
  | 'award_winner_computed'
  | 'award_published'

/**
 * Creates an audit log entry.
 *
 * This is intentionally fire-and-forget: if the DB write fails it logs
 * to console rather than throwing, so auditing never breaks the caller.
 *
 * @param action     - The audited action type.
 * @param entityType - The type of entity involved (e.g. 'FanVote', 'DJBallot').
 * @param entityId   - The UUID of the entity.
 * @param userId     - Optional user who performed the action.
 * @param metadata   - Additional structured data for transparency.
 */
export async function createAuditLog(
  action: AuditAction,
  entityType: string,
  entityId: string,
  userId?: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  try {
    await (prisma as unknown as {
      auditLog: { create: (args: unknown) => Promise<unknown> }
    }).auditLog.create({
      data: {
        action,
        entityType,
        entityId,
        userId: userId ?? null,
        metadata,
      },
    })
  } catch (err) {
    // Audit logging is non-critical — do not let a DB error break the main flow.
    console.error('[AuditLog] Failed to create audit log entry:', {
      action,
      entityType,
      entityId,
      userId,
      error: err instanceof Error ? err.message : String(err),
    })
  }
}
