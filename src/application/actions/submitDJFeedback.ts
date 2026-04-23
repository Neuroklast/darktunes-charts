'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

type DJFeedbackDb = {
  user: {
    findUnique: (args: unknown) => Promise<{ role: string; isDJVerified: boolean } | null>
  }
  dJFeedback: {
    create: (args: unknown) => Promise<{ id: string }>
  }
}

const feedbackSchema = z.object({
  bandId: z.string().uuid('Ungültige Band-ID'),
  trackId: z.string().uuid('Ungültige Track-ID').optional(),
  message: z
    .string()
    .min(10, 'Feedback muss mindestens 10 Zeichen enthalten')
    .max(2000, 'Feedback darf höchstens 2000 Zeichen enthalten'),
})

export type DJFeedbackInput = z.infer<typeof feedbackSchema>

export interface SubmitDJFeedbackResult {
  success: boolean
  error?: string
  feedbackId?: string
}

/**
 * Server Action: Submits DJ feedback for a band (Spec §9.2).
 *
 * Validates:
 * 1. User is authenticated and is a verified DJ.
 * 2. Input schema is valid (bandId, optional trackId, message).
 * 3. Message is within length bounds.
 *
 * Creates a DJFeedback record and revalidates the band dashboard path.
 *
 * @param input - Feedback data including bandId, optional trackId, and message.
 * @returns Success/failure result.
 */
export async function submitDJFeedback(input: DJFeedbackInput): Promise<SubmitDJFeedbackResult> {
  try {
    // 1. Auth check
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Nicht angemeldet' }
    }

    // 2. Input validation
    const parsed = feedbackSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message ?? 'Ungültige Eingabe' }
    }

    const { bandId, trackId, message } = parsed.data

    // 3. Verify DJ role via database (authoritative source)
    const db = prisma as unknown as DJFeedbackDb
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { role: true, isDJVerified: true },
    })

    if (!dbUser || (dbUser.role !== 'DJ' && dbUser.role !== 'ADMIN') || (dbUser.role === 'DJ' && !dbUser.isDJVerified)) {
      return { success: false, error: 'DJ-Verifizierung erforderlich' }
    }

    // 4. Persist feedback
    const feedback = await db.dJFeedback.create({
      data: { djId: user.id, bandId, trackId: trackId ?? null, message },
    })

    revalidatePath('/dashboard/band')
    revalidatePath('/dashboard/dj')

    return { success: true, feedbackId: feedback.id }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
    return { success: false, error: message }
  }
}
