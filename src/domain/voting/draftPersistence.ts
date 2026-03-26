/**
 * Voting Draft Persistence — Spec §8.1 Steuerbarkeit
 *
 * Provides localStorage-based draft saving/loading for voting panels so that
 * users can pause their voting session and resume later without losing their
 * work.  Drafts are keyed by voterId + period to avoid cross-user leakage.
 *
 * Drafts are automatically deleted when the user submits their final vote.
 *
 * Design decisions:
 *   - localStorage is used (not IndexedDB) for simplicity and universal browser support.
 *   - All functions are synchronous; localStorage I/O is blocking but negligible.
 *   - Data is JSON-serialised; no sensitive information is stored.
 *   - Functions are pure utilities; no React state is managed here.
 */

/** A serialisable draft for Fan QV voting: trackId → credits allocated. */
export interface FanVoteDraft {
  /** The voting period this draft belongs to. */
  periodId: string
  /** Map of trackId → voice credits allocated. */
  allocations: Record<string, number>
  /** ISO timestamp of last save. */
  savedAt: string
}

/** A serialisable draft for DJ ranked-choice voting: ordered list of trackIds. */
export interface DJBallotDraft {
  periodId: string
  /** trackIds in ranked order (index 0 = first choice). */
  rankedTrackIds: string[]
  savedAt: string
}

/** A serialisable draft for Band peer voting: bandId → weight allocated. */
export interface BandVoteDraft {
  periodId: string
  /** Map of bandId → weight (0–1). */
  weights: Record<string, number>
  savedAt: string
}

type DraftType = 'fan' | 'dj' | 'band'

function storageKey(type: DraftType, voterId: string, periodId: string): string {
  return `darktunes:draft:${type}:${voterId}:${periodId}`
}

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

// ---------------------------------------------------------------------------
// Fan Vote Draft
// ---------------------------------------------------------------------------

/**
 * Saves a fan vote draft to localStorage.
 *
 * @param voterId  - The authenticated user's ID.
 * @param draft    - The current allocation state.
 */
export function saveFanVoteDraft(voterId: string, draft: FanVoteDraft): void {
  if (!isBrowser()) return
  const key = storageKey('fan', voterId, draft.periodId)
  localStorage.setItem(key, JSON.stringify({ ...draft, savedAt: new Date().toISOString() }))
}

/**
 * Loads a fan vote draft from localStorage.
 *
 * @returns The saved draft or `null` if none exists.
 */
export function loadFanVoteDraft(voterId: string, periodId: string): FanVoteDraft | null {
  if (!isBrowser()) return null
  const raw = localStorage.getItem(storageKey('fan', voterId, periodId))
  if (!raw) return null
  try {
    return JSON.parse(raw) as FanVoteDraft
  } catch {
    return null
  }
}

/**
 * Deletes the fan vote draft — called after successful submission.
 */
export function clearFanVoteDraft(voterId: string, periodId: string): void {
  if (!isBrowser()) return
  localStorage.removeItem(storageKey('fan', voterId, periodId))
}

// ---------------------------------------------------------------------------
// DJ Ballot Draft
// ---------------------------------------------------------------------------

export function saveDJBallotDraft(voterId: string, draft: DJBallotDraft): void {
  if (!isBrowser()) return
  const key = storageKey('dj', voterId, draft.periodId)
  localStorage.setItem(key, JSON.stringify({ ...draft, savedAt: new Date().toISOString() }))
}

export function loadDJBallotDraft(voterId: string, periodId: string): DJBallotDraft | null {
  if (!isBrowser()) return null
  const raw = localStorage.getItem(storageKey('dj', voterId, periodId))
  if (!raw) return null
  try {
    return JSON.parse(raw) as DJBallotDraft
  } catch {
    return null
  }
}

export function clearDJBallotDraft(voterId: string, periodId: string): void {
  if (!isBrowser()) return
  localStorage.removeItem(storageKey('dj', voterId, periodId))
}

// ---------------------------------------------------------------------------
// Band Peer Vote Draft
// ---------------------------------------------------------------------------

export function saveBandVoteDraft(voterId: string, draft: BandVoteDraft): void {
  if (!isBrowser()) return
  const key = storageKey('band', voterId, draft.periodId)
  localStorage.setItem(key, JSON.stringify({ ...draft, savedAt: new Date().toISOString() }))
}

export function loadBandVoteDraft(voterId: string, periodId: string): BandVoteDraft | null {
  if (!isBrowser()) return null
  const raw = localStorage.getItem(storageKey('band', voterId, periodId))
  if (!raw) return null
  try {
    return JSON.parse(raw) as BandVoteDraft
  } catch {
    return null
  }
}

export function clearBandVoteDraft(voterId: string, periodId: string): void {
  if (!isBrowser()) return
  localStorage.removeItem(storageKey('band', voterId, periodId))
}
