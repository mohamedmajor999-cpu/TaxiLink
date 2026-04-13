import { createClient } from '@/lib/supabase/client'

export const authService = {
  async signIn(email: string, password: string) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
    return data
  },

  async signUp(params: {
    email:      string
    password:   string
    first_name: string
    last_name:  string
    phone?:     string
    department?: string
  }) {
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: {
          full_name:  `${params.first_name} ${params.last_name}`,
          first_name: params.first_name,
          last_name:  params.last_name,
          role:       'driver',
          phone:      params.phone,
          department: params.department,
        },
      },
    })
    if (error) throw new Error(error.message)
  },

  async signInWithGoogle(redirectTo: string) {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
    if (error) throw new Error(error.message)
  },

  async resetPassword(email: string, redirectTo: string) {
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    if (error) throw new Error(error.message)
  },

  async updateEmail(newEmail: string) {
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ email: newEmail })
    if (error) throw new Error(error.message)
  },

  async signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
  },

  async updatePassword(newPassword: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw new Error(error.message)
  },

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
