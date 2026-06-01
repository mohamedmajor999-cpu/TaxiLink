import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@taxilink/supabase-types';

// AsyncStorage = standard recommandé par Supabase pour React Native.
// Pas de limite de taille (vs 2 Ko Android Keystore qui faisait disparaître
// les sessions avec user_metadata enrichi, ex: dept_preferences). Le storage
// est sandboxé par app sur Android, donc safe pour un token éphémère.
const AsyncStorageAdapter = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
  removeItem: (key: string) => AsyncStorage.removeItem(key),
};

export function createMobileSupabaseClient() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error('[supabase] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY manquants');
  }
  return createClient<Database>(url, anon, {
    auth: {
      storage: AsyncStorageAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}
