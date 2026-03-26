/**
 * @module infrastructure/api/itunes
 *
 * Infrastructure layer adapter for the Apple iTunes Search API.
 * Re-exports all functions from the canonical implementation in `src/lib/itunesApi.ts`.
 *
 * Rate limit: Apple does not publish an official rate limit. Batch requests and
 * cache results to avoid throttling in production. ISRC is the preferred primary
 * key for deduplication when matching tracks across platforms.
 */
export {
  searchItunesTracks,
  lookupItunesTrack,
  getHighResArtwork,
} from '@/lib/itunesApi'
