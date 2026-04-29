import { createClient } from '@supabase/supabase-js'

// Client Supabase avec service_role : bypass RLS, à n'utiliser QUE dans les
// API routes /api/admin/* après vérification de l'email admin via assertAdmin().
//
// Volontairement non typé sur Database : on accède à des tables admin
// (ai_usage, auth_login_events, google_api_costs) qui ne sont pas dans
// types.ts tant que celui-ci n'a pas été régénéré post-migration.
//
// SUPABASE_SERVICE_ROLE_KEY ne doit JAMAIS être exposée côté client.
export function createAdminSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_URL manquant')
  return createClient(url, key, { auth: { persistSession: false } })
}
