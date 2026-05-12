/**
 * Image optimisation utilities using the wsrv.nl open-source image proxy.
 *
 * All images are served as WebP from wsrv.nl which provides:
 * - Format conversion (→ WebP for ~30 % smaller file size)
 * - Resize on the fly (reduces bandwidth for thumbnails)
 * - Global CDN caching (faster delivery world-wide)
 *
 * The original image URL is passed as a query parameter, so no credentials
 * are exposed and the source CDN (e.g. Spotify) is never called directly
 * from the browser.
 */

const WSRV_BASE = 'https://wsrv.nl'

/**
 * Returns an optimised WebP image URL via wsrv.nl.
 *
 * @param url   - Original image URL (e.g. Spotify CDN URL).
 * @param width - Desired output width in pixels.
 * @returns     An absolute wsrv.nl URL or an empty string when `url` is falsy.
 *
 * @example
 * <Image src={getOptimizedImageUrl(band.coverUrl, 400)} width={400} height={400} />
 */
export function getOptimizedImageUrl(url: string, width: number): string {
  if (!url) return ''
  return `${WSRV_BASE}/?url=${encodeURIComponent(url)}&w=${width}&output=webp&q=85`
}

/**
 * Returns a square cropped WebP thumbnail URL via wsrv.nl.
 * Uses `fit=cover` so the image fills the square without letterboxing.
 *
 * @param url  - Original image URL.
 * @param size - Side length of the square thumbnail in pixels.
 * @returns    An absolute wsrv.nl URL or an empty string when `url` is falsy.
 *
 * @example
 * <Image src={getSquareThumbnail(band.coverUrl, 64)} width={64} height={64} />
 */
export function getSquareThumbnail(url: string, size: number): string {
  if (!url) return ''
  return `${WSRV_BASE}/?url=${encodeURIComponent(url)}&w=${size}&h=${size}&fit=cover&output=webp&q=85`
}
