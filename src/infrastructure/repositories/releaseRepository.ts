import type { SupabaseClient } from '@supabase/supabase-js'

export interface CreateReleaseData {
  bandId: string
  title: string
  releaseDate: Date
  releaseType: string
  coverUrl?: string
}

export interface ReleaseRecord {
  id: string
  bandId: string
  title: string
  releaseDate: Date
  releaseType: string
  coverUrl?: string
  createdAt: Date
}

export class ReleaseRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async create(data: CreateReleaseData): Promise<ReleaseRecord> {
    const { data: result, error } = await this.supabase
      .from('releases')
      .insert({
        band_id: data.bandId,
        title: data.title,
        release_date: data.releaseDate.toISOString(),
        release_type: data.releaseType,
        cover_url: data.coverUrl
      })
      .select('*')
      .single()

    if (error) throw error

    return {
      id: result.id,
      bandId: result.band_id,
      title: result.title,
      releaseDate: new Date(result.release_date),
      releaseType: result.release_type,
      coverUrl: result.cover_url,
      createdAt: new Date(result.created_at)
    }
  }

  async findById(id: string): Promise<ReleaseRecord | null> {
    const { data, error } = await this.supabase
      .from('releases')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return null

    return {
      id: data.id,
      bandId: data.band_id,
      title: data.title,
      releaseDate: new Date(data.release_date),
      releaseType: data.release_type,
      coverUrl: data.cover_url,
      createdAt: new Date(data.created_at)
    }
  }

  async findByBandId(bandId: string): Promise<ReleaseRecord[]> {
    const { data, error } = await this.supabase
      .from('releases')
      .select('*')
      .eq('band_id', bandId)

    if (error || !data) return []

    return data.map(d => ({
      id: d.id,
      bandId: d.band_id,
      title: d.title,
      releaseDate: new Date(d.release_date),
      releaseType: d.release_type,
      coverUrl: d.cover_url,
      createdAt: new Date(d.created_at)
    }))
  }
}

let releaseRepoInstance: ReleaseRepository | null = null

export function releaseRepository(supabase: SupabaseClient): ReleaseRepository {
  if (!releaseRepoInstance) {
    releaseRepoInstance = new ReleaseRepository(supabase)
  }
  return releaseRepoInstance
}
