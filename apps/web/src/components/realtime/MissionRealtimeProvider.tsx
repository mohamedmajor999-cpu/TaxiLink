'use client'

import { createContext, useContext, useEffect, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { missionService } from '@/services/missionService'
import type { Mission } from '@/lib/supabase/types'

export interface MissionRealtimeCallbacks {
  onInsert?: (mission: Mission) => void
  onUpdate?: (mission: Mission) => void
  onDelete?: (mission: { id: string }) => void
}

type Subscription = MissionRealtimeCallbacks
type Subscribe = (cb: Subscription) => () => void

const MissionRealtimeContext = createContext<Subscribe | null>(null)

// M-01 (audit) : le payload broadcast est traité comme MINIMAL et NON fiable
// (canal public). On ne lit que { id, status } et on RE-FETCH la mission complète
// via le RPC authentifié get_mission_detail (missionService.getByIdMasked), qui masque
// la PII patient ET n'expose prix / trajet / motif médical / target_user_ids qu'au
// travers d'un appel authentifié. Plus aucune donnée métier (ni motif médical = donnée
// de santé Article 9) en clair sur le canal public. Aligné v2/v3 (re-hydrate par RPC).
// Compatible avec l'ancien payload riche : ses champs métier sont simplement ignorés.
type MissionEventPayload = { id?: string; status?: string | null }

export function MissionRealtimeProvider({ children }: { children: React.ReactNode }) {
  const subscribers = useRef(new Set<Subscription>())

  const subscribe = useMemo<Subscribe>(() => (cb) => {
    subscribers.current.add(cb)
    return () => { subscribers.current.delete(cb) }
  }, [])

  useEffect(() => {
    const supabase = createClient()

    // Re-hydrate la mission complète (masquée) depuis son id, puis dispatch.
    // INSERT : ajoute seulement si (toujours) AVAILABLE. UPDATE : propage si visible,
    // sinon retire du feed (null = acceptée par un autre / plus visible pour ce user).
    const hydrate = (id: string, kind: 'insert' | 'update') => {
      missionService.getByIdMasked(id)
        .then((m) => {
          if (kind === 'insert') {
            if (m && m.status === 'AVAILABLE') subscribers.current.forEach((s) => s.onInsert?.(m))
            return
          }
          if (m) subscribers.current.forEach((s) => s.onUpdate?.(m))
          else subscribers.current.forEach((s) => s.onDelete?.({ id }))
        })
        .catch(() => { /* best-effort : le canal temps réel n'est pas critique */ })
    }

    const missionsChannel = supabase
      .channel('missions-realtime', { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'INSERT' }, ({ payload }) => {
        const p = payload as MissionEventPayload | null
        // Payload public minimal : on ne fait confiance qu'à id + status.
        if (!p?.id || p.status !== 'AVAILABLE') return
        hydrate(p.id, 'insert')
      })
      .on('broadcast', { event: 'UPDATE' }, ({ payload }) => {
        const p = payload as MissionEventPayload | null
        if (!p?.id) return
        hydrate(p.id, 'update')
      })
      .on('broadcast', { event: 'DELETE' }, ({ payload }) => {
        const id = (payload as { id?: string } | null)?.id
        if (!id) return
        subscribers.current.forEach((s) => s.onDelete?.({ id }))
      })
      .subscribe()

    const broadcastChannel = supabase
      .channel('mission-events')
      .on('broadcast', { event: 'accepted' }, ({ payload }) => {
        const id = (payload as { id?: string } | null)?.id
        if (!id) return
        subscribers.current.forEach((s) => s.onDelete?.({ id }))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(missionsChannel)
      supabase.removeChannel(broadcastChannel)
    }
  }, [])

  return (
    <MissionRealtimeContext.Provider value={subscribe}>
      {children}
    </MissionRealtimeContext.Provider>
  )
}

export function useMissionRealtimeContext(): Subscribe | null {
  return useContext(MissionRealtimeContext)
}
