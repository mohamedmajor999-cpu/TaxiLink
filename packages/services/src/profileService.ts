import { getSupabaseClient } from './lib/client'
import type { Profile } from '@taxilink/supabase-types'

export const profileService = {
  async getProfile(userId: string): Promise<Profile | null> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  async getFullName(userId: string): Promise<string | null> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data?.full_name ?? null
  },

  // Batch fetch nom/telephone pour une liste d'ids — utilise par les vues qui
  // resolvent les chauffeurs lies a des missions (ads, marketplace, agenda).
  async getContactsByIds(
    ids: string[]
  ): Promise<Pick<Profile, 'id' | 'full_name' | 'phone'>[]> {
    if (ids.length === 0) return []
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, phone')
      .in('id', ids)
    if (error) throw new Error(error.message)
    return data ?? []
  },

  async getRole(userId: string): Promise<string | null> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
    if (error) throw new Error(error.message)
    return data?.role ?? null
  },

  async updateProfile(
    userId: string,
    updates: { first_name?: string; last_name?: string; full_name?: string; phone?: string }
  ): Promise<void> {
    const supabase = getSupabaseClient()
    // Si on fournit first/last_name sans full_name, on derive full_name automatiquement
    // pour garder les deux colonnes synchronisees.
    const payload: typeof updates = { ...updates }
    if ((updates.first_name != null || updates.last_name != null) && updates.full_name == null) {
      payload.full_name = `${updates.first_name ?? ''} ${updates.last_name ?? ''}`.trim()
    }
    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId)
      .select('id')
    if (error) throw new Error(error.message)
    // Si la ligne n'existait pas, update n'affecte 0 ligne sans erreur.
    // On upsert en fallback pour garantir la persistance (cas de trigger defaillant).
    if (!data || data.length === 0) {
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({ id: userId, ...payload }, { onConflict: 'id' })
      if (upsertError) throw new Error(upsertError.message)
    }
  },
}
