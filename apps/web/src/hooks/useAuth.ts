'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

// Quand une PWA passe en arriere-plan (iOS Safari surtout), JS est gele : le
// timer auto-refresh du SDK ne tourne plus. Au retour au premier plan, l'access
// token peut etre expire et la prochaine requete echoue parfois en cascade
// avant que le SDK n'ait eu le temps de refresh. On force un refresh explicite
// au visibilitychange pour que la session soit toujours fraiche quand l'user
// reprend la main -> persistance "type Instagram".
export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const onVisible = () => {
      if (typeof document === 'undefined' || document.visibilityState !== 'visible') return
      // best-effort : si le refresh token est revoke ou reseau down, le SDK
      // emettra un SIGNED_OUT via onAuthStateChange et on suivra. On swallow
      // l'erreur ici pour ne pas spammer la console au retour de fond.
      supabase.auth.refreshSession().catch(() => {})
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  return { user, loading }
}
