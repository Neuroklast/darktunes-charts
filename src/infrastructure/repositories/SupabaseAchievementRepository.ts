import type { SupabaseClient } from '@supabase/supabase-js'
import type { IAchievementRepository, EarnedAchievementRecord } from '@/domain/repositories'

export class SupabaseAchievementRepository implements IAchievementRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findEarnedByUserId(userId: string): Promise<EarnedAchievementRecord[]> {
    const { data, error } = await this.supabase
      .from('user_achievements')
      .select('granted_at, metadata, achievement:achievement_definitions(slug, title_en, desc_en, rarity, icon_key)')
      .eq('user_id', userId)

    if (error || !data) return []

    return data.map((row: any) => ({
      grantedAt: new Date(row.granted_at),
      metadata: row.metadata,
      slug: row.achievement.slug,
      title: row.achievement.title_en,
      description: row.achievement.desc_en,
      rarity: row.achievement.rarity,
      iconKey: row.achievement.icon_key,
      achievement: { slug: row.achievement.slug }
    }))
  }

  async grantAchievement(userId: string, achievementSlug: string, metadata?: Record<string, unknown>): Promise<void> {
    const { data: def } = await this.supabase
      .from('achievement_definitions')
      .select('id')
      .eq('slug', achievementSlug)
      .single()

    if (!def) throw new Error(`Achievement definition not found: ${achievementSlug}`)

    const { error } = await this.supabase
      .from('user_achievements')
      .upsert({
        user_id: userId,
        achievement_id: def.id,
        metadata: metadata || {}
      }, { onConflict: 'user_id,achievement_id' })

    if (error) throw error
  }

  async revokeAchievement(userId: string, achievementSlug: string): Promise<void> {
    const { data: def } = await this.supabase
      .from('achievement_definitions')
      .select('id')
      .eq('slug', achievementSlug)
      .single()

    if (!def) return

    const { error } = await this.supabase
      .from('user_achievements')
      .delete()
      .eq('user_id', userId)
      .eq('achievement_id', def.id)

    if (error) throw error
  }
}
