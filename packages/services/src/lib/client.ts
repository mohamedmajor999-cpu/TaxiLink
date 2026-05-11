// Singleton du client Supabase, partage entre tous les services.
//
// Pourquoi un singleton ?
// - Auth : Supabase doit gerer UN seul flux de refresh token / session.
// - Realtime : un seul WebSocket / canal de subscription par app.
// - Cross-platform : web (createBrowserClient avec cookies) et mobile
//   (createClient avec expo-secure-store) instancient leur propre client
//   au boot, puis le passent ici via setSupabaseClient().
//
// Chaque app DOIT appeler setSupabaseClient() au tout debut de son entry point
// (RootLayout pour Next.js, App.tsx pour Expo) avant qu'un service ne soit
// invoque, sinon getSupabaseClient() leve une erreur.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@taxilink/supabase-types'

export type TaxilinkSupabaseClient = SupabaseClient<Database>

let _client: TaxilinkSupabaseClient | null = null

export function setSupabaseClient(client: TaxilinkSupabaseClient): void {
  _client = client
}

export function getSupabaseClient(): TaxilinkSupabaseClient {
  if (!_client) {
    throw new Error(
      '[@taxilink/services] Supabase client not initialized. ' +
        'Call setSupabaseClient(client) at app boot before using any service.'
    )
  }
  return _client
}

// Reset utilise par les tests qui isolent chaque suite avec leur propre mock.
export function __resetSupabaseClient(): void {
  _client = null
}
