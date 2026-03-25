import { z } from 'zod'

/** EAN-13 barcode format validator */
export const EAN_PATTERN = /^\d{13}$/

/** ISO 8601 date string (YYYY-MM-DD) */
export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/** EUR amount: up to 8 digits, optional 2 decimal places */
export const AMOUNT_PATTERN = /^\d{1,8}(\.\d{1,2})?$/

export function isValidEAN(value: string): boolean {
  if (!EAN_PATTERN.test(value)) return false
  const digits = value.split('').map(Number)
  const checksum = digits.slice(0, 12).reduce((sum, d, i) => sum + d * (i % 2 === 0 ? 1 : 3), 0)
  return (10 - (checksum % 10)) % 10 === digits[12]
}

export function isValidDateString(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false
  const d = new Date(value)
  return !isNaN(d.getTime())
}

export function isValidAmount(value: string | number): boolean {
  const str = String(value)
  return AMOUNT_PATTERN.test(str) && parseFloat(str) >= 0
}

export const fanVoteSchema = z.object({
  trackId: z.string().min(1),
  votes: z.number().int().min(0).max(10),
  creditsSpent: z.number().int().min(0).max(100),
})

export const djBallotSchema = z.object({
  djId: z.string().min(1),
  rankings: z.array(z.string()).min(1),
})

export const peerVoteSchema = z.object({
  voterId: z.string().min(1),
  votedBandId: z.string().min(1),
  weight: z.number().min(0).max(1),
})

export const bandSchema = z.object({
  name: z.string().min(1).max(200),
  genre: z.enum(['Goth', 'Metal', 'Dark Electro']),
  spotifyMonthlyListeners: z.number().int().min(0),
  logoUrl: z.string().url().optional(),
  spotifyUrl: z.string().url().optional(),
  bandcampUrl: z.string().url().optional(),
})
