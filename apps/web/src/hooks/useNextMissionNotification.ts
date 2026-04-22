'use client'
import { useCallback, useEffect, useState } from 'react'
import type { Mission } from '@/lib/supabase/types'

const T_MINUS_MS = 15 * 60_000

export type NotificationState = 'default' | 'granted' | 'denied' | 'unsupported'

/**
 * Planifie une notification navigateur 15 minutes avant le départ de la
 * mission passée en argument. Nécessite que l'utilisateur ait accordé la
 * permission `Notification` — utilisez `requestPermission` pour la demander.
 * La notification ne se déclenche que si l'app reste ouverte dans l'onglet.
 */
export function useNextMissionNotification(mission: Mission | null) {
  const [permission, setPermission] = useState<NotificationState>('default')

  useEffect(() => {
    if (typeof window === 'undefined' || typeof Notification === 'undefined') {
      setPermission('unsupported')
      return
    }
    setPermission(Notification.permission as NotificationState)
  }, [])

  useEffect(() => {
    if (!mission || permission !== 'granted') return
    if (typeof Notification === 'undefined') return
    const target = new Date(mission.scheduled_at).getTime() - T_MINUS_MS
    const delay = target - Date.now()
    if (delay <= 0) return
    const id = window.setTimeout(() => {
      try {
        new Notification('Course dans 15 min', {
          body: `${mission.departure} → ${mission.destination}`,
          tag: `taxilink-course-${mission.id}`,
          icon: '/brand/icon.svg',
        })
      } catch { /* silencieux : certains navigateurs refusent sur HTTP */ }
    }, delay)
    return () => window.clearTimeout(id)
  }, [mission, permission])

  const requestPermission = useCallback(async (): Promise<NotificationState> => {
    if (typeof Notification === 'undefined') return 'unsupported'
    const result = await Notification.requestPermission()
    setPermission(result as NotificationState)
    return result as NotificationState
  }, [])

  return { permission, requestPermission }
}
