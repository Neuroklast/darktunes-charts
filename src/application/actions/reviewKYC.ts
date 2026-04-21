'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

type ReviewKYCDb = {
  user: {
    findUnique: (args: unknown) => Promise<{ role: string } | null>
    update: (args: unknown) => Promise<unknown>
  }
}

const reviewKYCSchema = z.object({
  userId: z.string().uuid(),
  decision: z.enum(['APPROVED', 'REJECTED']),
  notes: z.string().max(500).optional(),
})

export type ReviewKYCInput = z.infer<typeof reviewKYCSchema>

export interface ReviewKYCResult {
  success: boolean
  error?: string
}

/**
 * Server Action: Admin reviews and decides on a DJ KYC verification request.
 *
 * Only admins can call this action. Updates the user's KYC status and,
 * if approved, sets isDJVerified to true.
 *
 * @param input - User ID, decision, and optional notes.
 * @returns Success/failure result.
 */
export async function reviewKYC(input: ReviewKYCInput): Promise<ReviewKYCResult> {
  try {
    // 1. Auth + admin role check
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Nicht angemeldet' }
    }

    // 2. Input validation
    const parsed = reviewKYCSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: 'Ungültige KYC-Daten: ' + parsed.error.message }
    }

    const db = prisma as unknown as ReviewKYCDb

    // Admin-only check via database
    const caller = await db.user.findUnique({ where: { id: user.id }, select: { role: true } })
    if (!caller || caller.role !== 'ADMIN') {
      return { success: false, error: 'Nur Admins können KYC prüfen' }
    }

    await db.user.update({
      where: { id: parsed.data.userId },
      data: {
        kycStatus: parsed.data.decision,
        isDJVerified: parsed.data.decision === 'APPROVED',
        kycReviewedBy: user.id,
        kycReviewedAt: new Date(),
      },
    })

    revalidatePath('/admin/kyc')

    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
    return { success: false, error: message }
  }
}
