import type { SupabaseClient } from '@supabase/supabase-js'
import type { IBandRepository, CreateBandData, UpdateBandData } from '@/domain/repositories'

export class SupabaseBandRepository implements IBandRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async upsertByOwnerId(ownerId: string, create: CreateBandData, update: UpdateBandData): Promise<void> {
    const { data: existing } = await this.supabase
      .from('bands')
      .select('id')
      .eq('owner_id', ownerId)
      .single()

    if (existing) {
      const { error } = await this.supabase
        .from('bands')
        .update({
          name: update.name
        })
        .eq('id', existing.id)
      if (error) throw error
    } else {
      const { error } = await this.supabase
        .from('bands')
        .insert({
          owner_id: create.ownerId,
          name: create.name,
          slug: create.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          tier: create.tier,
          // Note: genre requires mapping if we added it, but it seems there's no direct genre field in schema
          // We can just ignore genre for the band table if it's not defined
        })
      if (error) throw error
    }
  }

  async findById(id: string): Promise<unknown | null> {
    const { data, error } = await this.supabase
      .from('bands')
      .select('*')
      .eq('id', id)
      .single()
    if (error || !data) return null
    return data
  }

  async findByOwnerId(ownerId: string): Promise<unknown[]> {
    const { data, error } = await this.supabase
      .from('bands')
      .select('*')
      .eq('owner_id', ownerId)
    if (error || !data) return []
    return data
  }
}
