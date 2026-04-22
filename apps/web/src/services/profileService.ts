import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/supabase/types'

export const profileService = {
  async getProfile(userId: string): Promise<Profile | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  async getFullName(userId: string): Promise<string | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data?.full_name ?? null
  },

  async getRole(userId: string): Promise<string | null> {
    const supabase = createClient()
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
    const supabase = createClient()
    // Si on fournit first/last_name sans full_name, on dérive full_name automatiquement
    // pour garder les deux colonnes synchronisées.
    const payload: typeof updates = { ...updates }
    if ((updates.first_name != null || updates.last_name != null) && updates.full_name == null) {
      payload.full_name = `${updates.first_name ?? ''} ${updates.last_name ?? ''}`.trim()
    }
    const { error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId)
    if (error) throw new Error(error.message)
  },
}
