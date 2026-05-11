import { getSupabaseClient } from './lib/client'

export const authService = {
  async signIn(email: string, password: string) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
    return data
  },

  async finalizeSignUp(params: {
    email: string
    password: string
    first_name: string
    last_name: string
    phone: string
    department: string
  }) {
    const supabase = getSupabaseClient()
    // emailRedirectTo : web utilise window.location.origin. Mobile devra
    // overrider via une option dediee plus tard (deep link expo://auth/callback).
    const emailRedirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : undefined
    const { data, error } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        emailRedirectTo,
        data: {
          full_name: `${params.first_name} ${params.last_name}`,
          first_name: params.first_name,
          last_name: params.last_name,
          role: 'driver',
          phone: params.phone,
          department: params.department,
          // Seed la liste des departements actifs avec celui du signup.
          // Le chauffeur pourra en ajouter/retirer via le profil.
          dept_preferences: [params.department],
        },
      },
    })
    if (error) throw new Error(error.message)
    // Supabase renvoie identities vides si l'email est deja utilise
    if (data.user && (data.user.identities?.length ?? 0) === 0) {
      throw new Error(
        'Cette adresse email est déjà inscrite. Connectez-vous ou réinitialisez votre mot de passe.'
      )
    }
  },

  async signInWithGoogle(redirectTo: string) {
    const supabase = getSupabaseClient()
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
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    if (error) throw new Error(error.message)
  },

  async updateEmail(newEmail: string) {
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.updateUser({ email: newEmail })
    if (error) throw new Error(error.message)
  },

  async signOut() {
    const supabase = getSupabaseClient()
    await supabase.auth.signOut()
  },

  // Force le refresh du JWT cote client. Utile apres un trigger SQL qui
  // modifie app_metadata (ex. profile_complete) pour eviter une boucle de
  // redirect en attendant l'expiration naturelle du token.
  async refreshSession() {
    const supabase = getSupabaseClient()
    await supabase.auth.refreshSession()
  },

  async resendConfirmation(email: string) {
    const supabase = getSupabaseClient()
    const emailRedirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : undefined
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo },
    })
    if (error) throw new Error(error.message)
  },

  async updatePassword(newPassword: string): Promise<void> {
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw new Error(error.message)
  },

  async exchangeCodeForSession(code: string) {
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) throw new Error(error.message)
  },
}
