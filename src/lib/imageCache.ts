/**
 * Utility for caching and resizing images via wsrv.nl.
 * Ensures consistent image delivery and reduces bandwidth.
 */

export interface CacheOptions {
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  output?: 'webp' | 'jpeg' | 'png' | 'avif';
  quality?: number;
}

/**
 * Transforms a standard image URL into a cached wsrv.nl URL.
 *
 * @param url The original image URL.
 * @param options Configuration for resizing and formatting.
 * @returns The wsrv.nl URL or the original URL if invalid.
 */
export function getCachedImageUrl(url: string | undefined | null, options: CacheOptions = {}): string | undefined {
  if (!url) return undefined;

  try {
    const encodedUrl = encodeURIComponent(url);
    const params = new URLSearchParams();

    params.append('url', encodedUrl);

    if (options.width) params.append('w', options.width.toString());
    if (options.height) params.append('h', options.height.toString());
    if (options.fit) params.append('fit', options.fit);
    if (options.output) params.append('output', options.output);
    if (options.quality) params.append('q', options.quality.toString());
    else params.append('q', '80'); // Default quality

    // Always use modern formats where possible if not specified
    if (!options.output) params.append('output', 'webp');

    return `https://wsrv.nl/?${params.toString()}`;
  } catch (error) {
    console.error('Failed to construct cached image URL:', error);
    return url;
  }
}
