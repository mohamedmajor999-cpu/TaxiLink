import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

// Persistance "type Instagram" : la session ne se termine que via un appareil
// signOut() volontaire (bouton Se deconnecter). Les cookies Supabase ont une
// duree d'1 an, le refresh token tourne automatiquement, et le SDK rehydrate
// la session depuis le storage au prochain mount. Ne JAMAIS passer
// `persistSession: false` ici, sinon la PWA et l'onglet web reperdent la
// session a chaque fermeture (cf. memoire `feedback_commit_full_chain`).
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession:    true,
        autoRefreshToken:  true,
        detectSessionInUrl: true,
        flowType:          'pkce',
      },
      cookieOptions: {
        maxAge:   ONE_YEAR_SECONDS,
        sameSite: 'lax',
        secure:   process.env.NODE_ENV === 'production',
        path:     '/',
      },
    }
  )
}
