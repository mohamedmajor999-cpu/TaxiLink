'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { missionService } from '@/services/missionService'
import type { Mission } from '@/lib/supabase/types'

export const HOUR_START = 8
export const HOUR_END = 20
export const PX_PER_MIN = 1
export const DAY_HEIGHT = (HOUR_END - HOUR_START) * 60 * PX_PER_MIN

export type AgendaEventStatus = 'completed' | 'now' | 'scheduled' | 'private'

export interface AgendaEvent {
  id: string
  start: Date
  end: Date
  status: AgendaEventStatus
  type: 'CPAM' | 'PRIVE' | 'TAXILINK'
  from: string
  to: string
  postedByMe: boolean
  priceEur: number
  topPx: number
  heightPx: number
}

function sameDay(a: Date, b: Date) { return a.toDateString() === b.toDateString() }
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r }

function toEvent(m: Mission, userId: string): AgendaEvent | null {
  const start = new Date(m.scheduled_at)
  const durationMin = Math.max(m.duration_min ?? Math.round((m.distance_km ?? 0) * 2.2), 10)
  const end = new Date(start.getTime() + durationMin * 60_000)
  const now = Date.now()
  const postedByMe = m.shared_by === userId
  const isCompleted = m.status === 'DONE' || end.getTime() < now
  const isNow = start.getTime() <= now && end.getTime() >= now && !isCompleted
  const status: AgendaEventStatus = isNow ? 'now'
    : isCompleted ? 'completed'
    : postedByMe && m.type === 'PRIVE' ? 'private'
    : 'scheduled'
  const startMin = start.getHours() * 60 + start.getMinutes()
  const dayStartMin = HOUR_START * 60
  const topPx = Math.max((startMin - dayStartMin) * PX_PER_MIN, 0)
  return {
    id: m.id,
    start, end, status,
    type: (['CPAM', 'PRIVE', 'TAXILINK'].includes(m.type) ? m.type : 'PRIVE') as AgendaEvent['type'],
    from: m.departure,
    to: m.destination,
    postedByMe,
    priceEur: Number(m.price_eur ?? 0),
    topPx,
    heightPx: Math.max(durationMin * PX_PER_MIN, 20),
  }
}

export function useAgendaTab() {
  const { user } = useAuth()
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState(new Date())
  const [nowTick, setNowTick] = useState(Date.now())
  const gridRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!user) return
    missionService.getAgenda(user.id)
      .then(setMissions)
      .catch((e) => setError(e instanceof Error ? e.message : 'Erreur'))
      .finally(() => setLoading(false))
  }, [user])

  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!gridRef.current || !sameDay(selected, new Date())) return
    const now = new Date()
    const minutesFromStart = (now.getHours() - HOUR_START) * 60 + now.getMinutes()
    gridRef.current.scrollTo({ top: Math.max(minutesFromStart * PX_PER_MIN - 150, 0), behavior: 'auto' })
  }, [selected, loading])

  const today = new Date()
  const dayPills = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => {
      const d = addDays(today, i)
      const label = i === 0 ? 'Aujourd\'hui' : i === 1 ? 'Demain' : d.toLocaleDateString('fr-FR', { weekday: 'long' })
      const subLabel = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
      return { date: d, label, subLabel, key: d.toDateString() }
    })
  }, [today])

  const events = useMemo<AgendaEvent[]>(() => {
    if (!user) return []
    return missions
      .filter((m) => sameDay(new Date(m.scheduled_at), selected))
      .map((m) => toEvent(m, user.id))
      .filter((e): e is AgendaEvent => e !== null)
      .sort((a, b) => a.start.getTime() - b.start.getTime())
  }, [missions, selected, user, nowTick])

  const stats = useMemo(() => ({
    count: events.length,
    total: events.reduce((s, e) => s + e.priceEur, 0),
    km: missions
      .filter((m) => sameDay(new Date(m.scheduled_at), selected))
      .reduce((s, m) => s + Number(m.distance_km ?? 0), 0),
  }), [events, missions, selected])

  const hours = useMemo(
    () => Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i),
    []
  )

  const isToday = sameDay(selected, new Date())
  const nowTopPx = isToday
    ? ((new Date().getHours() - HOUR_START) * 60 + new Date().getMinutes()) * PX_PER_MIN
    : null

  const title = selected.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  return {
    loading, error,
    selected, setSelected,
    dayPills, events, hours, stats, title,
    nowTopPx, gridRef,
    dayHeight: DAY_HEIGHT,
  }
}
