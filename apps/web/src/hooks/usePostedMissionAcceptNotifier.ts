'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from './useAuth'
import { createClient } from '@/lib/supabase/client'
import type { Mission } from '@/lib/supabase/types'

/**
 * Écoute globale : prévient le chauffeur propriétaire quand une de ses annonces
 * est acceptée par un autre chauffeur. Notification navigateur uniquement (les
 * toasts tab-scope sont gérés par usePostedTab).
 *
 * Utilise un channel Supabase dédié pour ne pas entrer en conflit avec la
 * souscription principale de useDriverMissions.
 */
export function usePostedMissionAcceptNotifier() {
  const { user } = useAuth()
  const notifiedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!user?.id) return
    notifiedRef.current = new Set()

    let channel: ReturnType<ReturnType<typeof createClient>['channel']> | null = null
    try {
      const supabase = createClient()
      channel = supabase
        .channel(`posted-accept-notifier-${user.id}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'missions', filter: `shared_by=eq.${user.id}` },
          (payload) => {
            const m = payload.new as Mission
            if (!m || m.status === 'AVAILABLE') return
            if (notifiedRef.current.has(m.id)) return
            notifiedRef.current.add(m.id)

            if (typeof window === 'undefined' || typeof Notification === 'undefined') return
            if (Notification.permission !== 'granted') return
            try {
              new Notification('Votre course a été prise !', {
                body: `${m.departure} → ${m.destination}`,
                tag: `taxilink-accepted-${m.id}`,
                icon: '/brand/icon.svg',
              })
            } catch { /* silencieux */ }
          }
        )
        .subscribe()
    } catch { /* silencieux : on ne casse pas le dashboard si la souscription echoue */ }

    return () => {
      if (channel) {
        try { createClient().removeChannel(channel) } catch { /* silencieux */ }
      }
    }
  }, [user?.id])
}
