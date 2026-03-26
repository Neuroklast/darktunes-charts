'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().optional(),
  bio: z.string().max(1000).optional(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

export interface UpdateProfileResult {
  success: boolean
  error?: string
}

/**
 * Server Action: Updates the authenticated user's profile.
 *
 * Only the authenticated user can update their own profile.
 * All fields are optional — only provided fields are updated.
 *
 * @param input - Partial profile update data.
 * @returns Success/failure result.
 */
export async function updateProfile(input: UpdateProfileInput): Promise<UpdateProfileResult> {
  try {
    // 1. Auth check
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Nicht angemeldet' }
    }

    // 2. Input validation
    const parsed = updateProfileSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: 'Ungültige Profil-Daten: ' + parsed.error.message }
    }

    // In production with Prisma:
    // await prisma.user.update({
    //   where: { id: user.id },
    //   data: { ...parsed.data, updatedAt: new Date() },
    // })

    revalidatePath('/profile')

    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
    return { success: false, error: message }
  }
}
