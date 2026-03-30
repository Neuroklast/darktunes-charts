import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Maps country names common in the dark/alternative music scene to their
 * corresponding emoji flag representation (Unicode Regional Indicator Symbols).
 *
 * Declared outside the function to avoid re-creating the object on every call.
 */
const COUNTRY_FLAGS: Readonly<Record<string, string>> = {
  'Germany': '🇩🇪',
  'USA': '🇺🇸',
  'Sweden': '🇸🇪',
  'UK': '🇬🇧',
  'France': '🇫🇷',
  'Italy': '🇮🇹',
  'Norway': '🇳🇴',
  'Finland': '🇫🇮',
  'Netherlands': '🇳🇱',
  'Belgium': '🇧🇪',
  'Austria': '🇦🇹',
  'Switzerland': '🇨🇭',
  'Poland': '🇵🇱',
  'Czech Republic': '🇨🇿',
  'Russia': '🇷🇺',
  'Mexico': '🇲🇽',
  'Canada': '🇨🇦',
  'Australia': '🇦🇺',
  'Japan': '🇯🇵',
  'Spain': '🇪🇸',
  'Denmark': '🇩🇰',
  'Hungary': '🇭🇺',
  'Romania': '🇷🇴',
  'Greece': '🇬🇷',
  'Brazil': '🇧🇷',
  'Argentina': '🇦🇷',
  'Portugal': '🇵🇹',
  'Ireland': '🇮🇪',
  'Ukraine': '🇺🇦',
  'Serbia': '🇷🇸',
  'Croatia': '🇭🇷',
  'Slovakia': '🇸🇰',
  'Slovenia': '🇸🇮',
}

/**
 * Returns the emoji flag for a country name.
 *
 * Returns an empty string for unmapped country names so callers can safely
 * skip rendering when no flag is available. Handles compound country strings
 * like "Switzerland / Netherlands" by using the first country listed.
 *
 * @param country - The country name as stored in the Band record (e.g. 'Germany').
 * @returns An emoji flag string (e.g. '🇩🇪') or '' if the country is not mapped.
 */
export function getCountryFlag(country: string): string {
  // Handle compound country strings like "Switzerland / Netherlands" → use first
  const primary = country.split('/')[0]?.trim() ?? country
  return COUNTRY_FLAGS[primary] ?? ''
}

/**
 * Genre-specific gradient class strings for use as Tailwind `bg-gradient-to-br` values.
 * Shared across album art fallbacks, hero images, and discovery cards.
 */
export const GENRE_GRADIENTS: Readonly<Record<string, string>> = {
  'Goth':        'from-purple-900 via-gray-900 to-black',
  'Metal':       'from-gray-900 via-red-950 to-black',
  'Dark Electro':'from-cyan-950 via-gray-900 to-black',
}

/**
 * Maps a band tier string to the shadcn/ui Badge variant.
 * Extracted here to avoid duplication across chart, profile, and discovery components.
 */
export function getTierBadgeVariant(tier: string): 'destructive' | 'default' | 'secondary' | 'outline' {
  switch (tier) {
    case 'Macro':         return 'destructive'
    case 'International': return 'destructive'
    case 'Established':   return 'default'
    case 'Emerging':      return 'secondary'
    default:              return 'outline'
  }
}

/**
 * Deterministic pseudo-random number generator based on a numeric seed.
 *
 * Uses the sine function to produce stable values in the range [0, 1).
 * Useful for UI displays that must not flicker on re-render (e.g., placeholder
 * scores before real voting data is connected), without relying on React state.
 *
 * @param seed - An integer seed value (typically an array index or hash).
 * @returns A stable float in [0, 1).
 */
export function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10_000
  return x - Math.floor(x)
}
