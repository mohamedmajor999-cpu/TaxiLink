import { createClient } from '@/lib/supabase/client'

export const userPrefsService = {
  async getNotificationPrefs(): Promise<Record<string, boolean> | null> {
    const supabase = createClient()
    const { data, error } = await supabase.auth.getUser()
    if (error) return null
    return (data.user?.user_metadata?.notification_prefs as Record<string, boolean>) ?? null
  },

  async updateNotificationPrefs(prefs: Record<string, boolean>): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ data: { notification_prefs: prefs } })
    if (error) throw new Error(error.message)
  },
}
