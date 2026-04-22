import { createClient } from '@/lib/supabase/client'

export const authService = {
  async signIn(email: string, password: string) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
    return data
  },

  async finalizeSignUp(params: {
    email:      string
    password:   string
    first_name: string
    last_name:  string
    phone?:     string
    department?: string
  }) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email:    params.email,
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
    // Supabase renvoie identities vides si l'email est deja utilise
    if (data.user && (data.user.identities?.length ?? 0) === 0) {
      throw new Error('Cette adresse email est déjà inscrite. Connectez-vous ou réinitialisez votre mot de passe.')
    }
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
}
