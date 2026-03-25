import { v4 as uuidv4 } from 'uuid'

const SESSION_KEY = 'darktunes-session-id'

/**
 * Returns a stable anonymous session identifier for the current browser session.
 *
 * The ID is generated once per browser session using UUID v4 and stored in
 * sessionStorage (not localStorage) so it resets on tab/window close.
 * No personally identifiable information is stored.
 *
 * @returns A UUID v4 string identifying this anonymous session.
 */
export function getSessionId(): string {
  const existing = sessionStorage.getItem(SESSION_KEY)
  if (existing) return existing
  const id = uuidv4()
  sessionStorage.setItem(SESSION_KEY, id)
  return id
}
