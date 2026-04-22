'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from './useAuth'
import { useMissionRealtime } from './useMissionRealtime'
import type { Mission } from '@/lib/supabase/types'

/**
 * Écoute globale : prévient le chauffeur propriétaire quand une de ses annonces
 * est acceptée par un autre chauffeur. Notification navigateur uniquement (les
 * toasts tab-scope sont gérés par usePostedTab).
 */
export function usePostedMissionAcceptNotifier() {
  const { user } = useAuth()
  const userIdRef = useRef<string | null>(null)
  userIdRef.current = user?.id ?? null
  const notifiedRef = useRef<Set<string>>(new Set())

  useEffect(() => { notifiedRef.current = new Set() }, [user?.id])

  useMissionRealtime({
    onUpdate: (m: Mission) => {
      const uid = userIdRef.current
      if (!uid || m.shared_by !== uid) return
      if (m.status === 'AVAILABLE') return
      if (notifiedRef.current.has(m.id)) return
      notifiedRef.current.add(m.id)

      if (typeof Notification === 'undefined') return
      if (Notification.permission !== 'granted') return
      try {
        new Notification('Votre course a été prise !', {
          body: `${m.departure} → ${m.destination}`,
          tag: `taxilink-accepted-${m.id}`,
          icon: '/brand/icon.svg',
        })
      } catch { /* silencieux */ }
    },
  })
}
