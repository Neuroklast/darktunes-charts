/**
 * @deprecated Import directly from `@/domain/voting` in new code.
 *
 * Backward-compatibility shim. All audit logic has been moved to
 * `src/domain/voting/audit.ts`. Existing imports continue to work.
 */
export {
  createTransparencyLogEntry,
  detectBotActivity,
  quarantineVotes,
} from '@/domain/voting/audit'
