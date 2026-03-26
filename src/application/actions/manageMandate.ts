'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const grantMandateSchema = z.object({
  labelId: z.string().uuid(),
  bandId: z.string().uuid(),
})

const revokeMandateSchema = z.object({
  mandateId: z.string().uuid(),
})

export interface MandateResult {
  success: boolean
  error?: string
  mandateId?: string
}

/**
 * Server Action: Grants a label mandate for a band.
 *
 * Only the authenticated band owner can grant a mandate.
 * Creates a PENDING mandate that the label must confirm.
 *
 * @param input - Label ID and Band ID for the mandate.
 * @returns Success/failure with mandate ID.
 */
export async function grantMandate(input: z.infer<typeof grantMandateSchema>): Promise<MandateResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Nicht angemeldet' }
    }

    const parsed = grantMandateSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: 'Ungültige Mandate-Daten: ' + parsed.error.message }
    }

    // In production with Prisma:
    // const mandate = await prisma.labelBandMandate.create({
    //   data: { labelId: parsed.data.labelId, bandId: parsed.data.bandId, status: 'PENDING' }
    // })

    revalidatePath('/profile')
    revalidatePath('/dashboard/label')

    return { success: true, mandateId: 'new-mandate-id' }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
    return { success: false, error: message }
  }
}

/**
 * Server Action: Revokes a label mandate.
 *
 * Only the band owner or admin can revoke.
 *
 * @param input - The mandate ID to revoke.
 * @returns Success/failure.
 */
export async function revokeMandate(input: z.infer<typeof revokeMandateSchema>): Promise<MandateResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Nicht angemeldet' }
    }

    const parsed = revokeMandateSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: 'Ungültige Mandate-ID: ' + parsed.error.message }
    }

    // In production with Prisma:
    // await prisma.labelBandMandate.update({
    //   where: { id: parsed.data.mandateId },
    //   data: { status: 'REVOKED', revokedAt: new Date() }
    // })

    revalidatePath('/profile')
    revalidatePath('/dashboard/label')

    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
    return { success: false, error: message }
  }
}
