import { createClient } from '@/lib/supabase/client'

export const authService = {
  async signIn(email: string, password: string) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
    return data
  },

  async signUp(params: {
    email: string
    password: string
    full_name: string
    role: string
    phone?: string
    pro_number?: string
  }) {
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: {
          full_name: params.full_name,
          role: params.role,
          pro_number: params.pro_number,
          phone: params.phone,
        },
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
}
