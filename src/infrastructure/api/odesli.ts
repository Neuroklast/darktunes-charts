/**
 * @module infrastructure/api/odesli
 *
 * Infrastructure layer adapter for the Odesli (song.link) API.
 * Re-exports all functions from the canonical implementation in `src/lib/odesliApi.ts`.
 *
 * Rate limit: ~10 requests/minute. Odesli calls must be async during track ingestion
 * and results cached in the database (`track_streaming_links` table) to avoid
 * repeated lookups. Never call this synchronously in a hot API route.
 */
export {
  fetchOdesliLinks,
  fetchOdesliBySpotifyId,
  getBestArtworkFromOdesli,
} from '@/lib/odesliApi'
