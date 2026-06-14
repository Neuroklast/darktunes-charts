import type { SupabaseClient } from '@supabase/supabase-js'

export class LabelRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findLabelById(id: string): Promise<unknown | null> {
    const { data, error } = await this.supabase
      .from('labels')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return null
    return data
  }

  async getLabelMembers(labelId: string): Promise<unknown[]> {
    const { data, error } = await this.supabase
      .from('label_members')
      .select('*, users(*)')
      .eq('label_id', labelId)

    if (error || !data) return []
    return data
  }
}
