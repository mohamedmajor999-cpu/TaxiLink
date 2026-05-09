'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from './useAuth'
import { useMissionRealtime } from './useMissionRealtime'
import { createClient } from '@/lib/supabase/client'
import { usePostedAcceptStore } from '@/store/postedAcceptStore'
import { playNotificationSound } from '@/lib/playNotificationSound'

const POSTED_ADS_PATH = '/dashboard/chauffeur?tab=courses&subtab=ads'

/**
 * Écoute globale : quand une des annonces postées par l'utilisateur est
 * acceptée par un autre chauffeur, récupère son profil, alimente le store
 * (badge + popup) et émet un son + une notification système.
 *
 * Utilise useMissionRealtime (broadcast partagé) au lieu d'un canal
 * postgres_changes dédié — économise un WebSocket. Le payload broadcast
 * vide les PII patient mais conserve `driver_id` / `shared_by` qu'on
 * utilise ici.
 */
export function usePostedMissionAcceptNotifier() {
  const { user } = useAuth()
  const notifiedRef = useRef<Set<string>>(new Set())
  const userIdRef = useRef<string | null>(null)
  userIdRef.current = user?.id ?? null
  const add = usePostedAcceptStore((s) => s.add)
  const reset = usePostedAcceptStore((s) => s.reset)

  // Reset à chaque changement d'utilisateur (login/logout).
  useEffect(() => {
    if (!user?.id) return
    notifiedRef.current = new Set()
    reset()
  }, [user?.id, reset])

  useMissionRealtime({
    onUpdate: (m) => {
      const uid = userIdRef.current
      if (!uid) return
      if (m.shared_by !== uid) return
      if (m.status === 'AVAILABLE' || !m.driver_id) return
      if (notifiedRef.current.has(m.id)) return
      notifiedRef.current.add(m.id)
      void notifyAcceptance(m, add)
    },
  })
}

async function notifyAcceptance(
  m: { id: string; driver_id: string | null; departure: string; destination: string; accepted_at: string | null },
  add: ReturnType<typeof usePostedAcceptStore.getState>['add'],
): Promise<void> {
  let driverName = 'Un chauffeur'
  let driverPhone: string | null = null
  if (m.driver_id) {
    try {
      const supabase = createClient()
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', m.driver_id)
        .maybeSingle()
      if (profile?.full_name?.trim()) driverName = profile.full_name.trim()
      if (profile?.phone?.trim()) driverPhone = profile.phone.trim()
    } catch { /* silencieux */ }
  }

  add({
    missionId: m.id,
    departure: m.departure,
    destination: m.destination,
    acceptedAt: m.accepted_at ?? new Date().toISOString(),
    driverName,
    driverPhone,
  })
  playNotificationSound()

  if (typeof window === 'undefined' || typeof Notification === 'undefined') return
  if (Notification.permission !== 'granted') return
  try {
    const n = new Notification(`${driverName} a accepté votre annonce`, {
      body: `${m.departure} → ${m.destination}`,
      tag: `taxilink-accepted-${m.id}`,
      icon: '/brand/icon.svg',
    })
    n.onclick = (e) => {
      e.preventDefault()
      try { window.focus() } catch { /* silencieux */ }
      n.close()
      try {
        window.location.assign(POSTED_ADS_PATH)
      } catch { /* silencieux */ }
    }
  } catch { /* silencieux */ }
}
