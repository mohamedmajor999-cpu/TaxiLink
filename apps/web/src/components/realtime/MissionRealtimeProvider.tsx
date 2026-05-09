'use client'

import { createContext, useContext, useEffect, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Mission } from '@/lib/supabase/types'

export interface MissionRealtimeCallbacks {
  onInsert?: (mission: Mission) => void
  onUpdate?: (mission: Mission) => void
  onDelete?: (mission: { id: string }) => void
}

type Subscription = MissionRealtimeCallbacks
type Subscribe = (cb: Subscription) => () => void

const MissionRealtimeContext = createContext<Subscribe | null>(null)

type MissionPublicPayload = Omit<
  Mission,
  'patient_name' | 'phone' | 'notes' | 'pickup_signature_url' | 'transport_voucher_url'
>

function publicToMission(p: MissionPublicPayload): Mission {
  return {
    ...(p as unknown as Mission),
    patient_name: null,
    phone: null,
    notes: null,
    pickup_signature_url: null,
    transport_voucher_url: null,
  }
}

export function MissionRealtimeProvider({ children }: { children: React.ReactNode }) {
  const subscribers = useRef(new Set<Subscription>())

  const subscribe = useMemo<Subscribe>(() => (cb) => {
    subscribers.current.add(cb)
    return () => { subscribers.current.delete(cb) }
  }, [])

  useEffect(() => {
    const supabase = createClient()

    const missionsChannel = supabase
      .channel('missions-realtime', { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'INSERT' }, ({ payload }) => {
        if (!payload || typeof payload !== 'object') return
        const m = publicToMission(payload as MissionPublicPayload)
        if (m.status !== 'AVAILABLE') return
        subscribers.current.forEach((s) => s.onInsert?.(m))
      })
      .on('broadcast', { event: 'UPDATE' }, ({ payload }) => {
        if (!payload || typeof payload !== 'object') return
        const m = publicToMission(payload as MissionPublicPayload)
        subscribers.current.forEach((s) => s.onUpdate?.(m))
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
