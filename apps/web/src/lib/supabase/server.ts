import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

// Voir lib/supabase/client.ts pour la rationale (persistance "type Instagram").
// On force le maxAge cote serveur pour ne pas dependre du defaut @supabase/ssr.
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        maxAge:   ONE_YEAR_SECONDS,
        sameSite: 'lax',
        secure:   process.env.NODE_ENV === 'production',
        path:     '/',
      },
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
