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
    updates: { full_name?: string; phone?: string }
  ): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
    if (error) throw new Error(error.message)
  },
}
