import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import type { Database } from '@taxilink/supabase-types'

// Adaptateur SecureStore -> interface Storage attendue par supabase-js.
// SecureStore = Keychain iOS / Keystore Android, chiffre par OS.
// Limite : valeurs > 2 Ko sur Android => fallback console pour ces cles
// (rare en pratique, le refresh token tient largement en dessous).
const SecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
}

export function createMobileSupabaseClient() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL
  const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) {
    throw new Error(
      '[supabase] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY manquants',
    )
  }
  return createClient<Database>(url, anon, {
    auth: {
      storage: SecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  })
}
