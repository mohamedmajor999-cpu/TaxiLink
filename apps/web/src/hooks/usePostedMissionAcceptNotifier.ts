'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from './useAuth'
import { createClient } from '@/lib/supabase/client'
import { usePostedAcceptStore } from '@/store/postedAcceptStore'
import type { Mission } from '@/lib/supabase/types'

/**
 * Écoute globale : quand une des annonces postées par l'utilisateur est acceptée,
 * récupère le profil du chauffeur accepteur, l'ajoute au store (badge + popup)
 * et émet une notification navigateur.
 */
export function usePostedMissionAcceptNotifier() {
  const { user } = useAuth()
  const notifiedRef = useRef<Set<string>>(new Set())
  const add = usePostedAcceptStore((s) => s.add)
  const reset = usePostedAcceptStore((s) => s.reset)

  useEffect(() => {
    if (!user?.id) return
    notifiedRef.current = new Set()
    reset()

    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | null = null

    try {
      channel = supabase
        .channel(`posted-accept-notifier-${user.id}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'missions', filter: `shared_by=eq.${user.id}` },
          async (payload) => {
            const m = payload.new as Mission
            if (!m || m.status === 'AVAILABLE' || !m.driver_id) return
            if (notifiedRef.current.has(m.id)) return
            notifiedRef.current.add(m.id)

            let driverName = 'Un chauffeur'
            let driverPhone: string | null = null
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, phone')
                .eq('id', m.driver_id)
                .maybeSingle()
              if (profile?.full_name?.trim()) driverName = profile.full_name.trim()
              if (profile?.phone?.trim()) driverPhone = profile.phone.trim()
            } catch { /* silencieux */ }

            add({
              missionId: m.id,
              departure: m.departure,
              destination: m.destination,
              acceptedAt: m.accepted_at ?? new Date().toISOString(),
              driverName,
              driverPhone,
            })

            if (typeof window !== 'undefined' && typeof Notification !== 'undefined'
              && Notification.permission === 'granted') {
              try {
                new Notification(`${driverName} a accepté votre annonce`, {
                  body: `${m.departure} → ${m.destination}`,
                  tag: `taxilink-accepted-${m.id}`,
                  icon: '/brand/icon.svg',
                })
              } catch { /* silencieux */ }
            }
          }
        )
        .subscribe()
    } catch { /* silencieux : on ne casse pas le dashboard si la souscription echoue */ }

    return () => {
      if (channel) {
        try { supabase.removeChannel(channel) } catch { /* silencieux */ }
      }
    }
  }, [user?.id, add, reset])
}
