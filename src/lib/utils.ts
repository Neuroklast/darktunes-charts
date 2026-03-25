import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
