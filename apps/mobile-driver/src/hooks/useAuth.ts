// Equivalent mobile de apps/web/src/hooks/useAuth.ts.
//
// Difference cle : sur web on ecoute `document.visibilitychange` pour
// rafraichir le token quand la PWA revient au premier plan. Sur RN, on
// ecoute `AppState.change` qui emet 'active' quand l'app revient au foreground.
// Meme finalite : refresh token toujours frais quand l'user reprend la main
// (persistance "type Instagram", cf. memoire `project_persistent_auth`).

import { useEffect, useState } from 'react'
import { AppState } from 'react-native'
import type { User } from '@supabase/supabase-js'
import { getSupabaseClient } from '@taxilink/services'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = getSupabaseClient()

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const onAppStateChange = (state: string) => {
      if (state !== 'active') return
      // Best-effort : si le refresh token est revoque ou reseau down, le SDK
      // emettra SIGNED_OUT via onAuthStateChange et on suivra. Swallow ici
      // pour ne pas spammer la console au retour de fond.
      supabase.auth.refreshSession().catch(() => {})
    }
    const appStateSub = AppState.addEventListener('change', onAppStateChange)

    return () => {
      subscription.unsubscribe()
      appStateSub.remove()
    }
  }, [])

  return { user, loading }
}
