import type { SupabaseClient } from '@supabase/supabase-js'
import type { IUserRepository, UserRecord, UserRoleRecord, CreateUserData, UpdateUserData } from '@/domain/repositories'

export class SupabaseUserRepository implements IUserRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findById(id: string): Promise<UserRecord | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('id, role, name, email, credits, avatar_url, is_dj_verified, created_at, bands(id)')
      .eq('id', id)
      .single()

    if (error || !data) return null

    return {
      id: data.id,
      role: data.role,
      name: data.name,
      email: data.email,
      credits: data.credits,
      avatarUrl: data.avatar_url,
      isDJVerified: data.is_dj_verified,
      createdAt: new Date(data.created_at),
      band: data.bands && data.bands.length > 0 ? { id: data.bands[0].id } : null
    } as unknown as UserRecord
  }

  async findRoleById(id: string): Promise<UserRoleRecord | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('role')
      .eq('id', id)
      .single()

    if (error || !data) return null
    return { role: data.role } as UserRoleRecord
  }

  async upsert(id: string, create: CreateUserData, update: UpdateUserData): Promise<UserRecord> {
    const { data: existing } = await this.supabase.from('users').select('id').eq('id', id).single()

    let result
    if (existing) {
      const { data, error } = await this.supabase
        .from('users')
        .update({
          name: update.name,
          role: update.role,
          avatar_url: update.avatarUrl,
        })
        .eq('id', id)
        .select('id, role, name, email, credits, avatar_url, is_dj_verified, created_at, bands(id)')
        .single()
      if (error) throw error
      result = data
    } else {
      const { data, error } = await this.supabase
        .from('users')
        .insert({
          id: create.id,
          email: create.email,
          name: create.name,
          role: create.role,
          avatar_url: create.avatarUrl,
          credits: create.credits,
        })
        .select('id, role, name, email, credits, avatar_url, is_dj_verified, created_at, bands(id)')
        .single()
      if (error) throw error
      result = data
    }

    return {
      id: result.id,
      role: result.role,
      name: result.name,
      email: result.email,
      credits: result.credits,
      avatarUrl: result.avatar_url,
      isDJVerified: result.is_dj_verified,
      createdAt: new Date(result.created_at),
      band: result.bands && result.bands.length > 0 ? { id: result.bands[0].id } : null
    } as unknown as UserRecord
  }
}
