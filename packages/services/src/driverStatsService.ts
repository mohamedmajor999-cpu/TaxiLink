import { getSupabaseClient } from './lib/client'

export const driverStatsService = {
  // Compte les chauffeurs inscrits, optionnellement filtres sur un departement
  // present dans dept_preferences. Utilise pour le social proof onboarding.
  // RLS : si l'anon role n'a pas le SELECT, retourne 0 → consumer utilise un
  // fallback hardcode (pas d'erreur visible cote user).
  async getCount(dept?: string): Promise<number> {
    const supabase = getSupabaseClient()
    let query = supabase
      .from('drivers')
      .select('id', { count: 'exact', head: true })
    if (dept) {
      query = query.contains('dept_preferences', [dept])
    }
    const { count, error } = await query
    if (error) throw new Error(error.message)
    return count ?? 0
  },
}
