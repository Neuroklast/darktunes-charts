/**
 * Mock Spotify API helpers for the MVP phase.
 *
 * In production these functions call the real Spotify Web API via the backend.
 * During development they return deterministic or randomly seeded data so UI
 * work can proceed without live API credentials.
 */

/**
 * Simulates fetching Spotify monthly listener data for a band.
 * In production this calls the Spotify Web API via the backend.
 * @param _bandId - Band identifier (reserved for real API integration).
 * @returns A promise resolving to a mock listener count.
 */
export function simulateSpotifyListenersFetch(_bandId: string): Promise<number> {
  return new Promise(resolve => {
    setTimeout(() => {
      const mockListeners = Math.floor(Math.random() * 1_000_000) + 1_000
      resolve(mockListeners)
    }, 500)
  })
}
