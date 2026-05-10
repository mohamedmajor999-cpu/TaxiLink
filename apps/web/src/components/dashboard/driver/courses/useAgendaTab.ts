'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useDriverAgendaStore } from '@/store/driverAgendaStore'
import type { Mission } from '@/lib/supabase/types'
import { sameDay, addDays, startOfDay, startOfWeek, agendaDayLabel, toEvent, type AgendaEvent } from './agendaHelpers'
import { useAgendaActions } from './useAgendaActions'

export type { AgendaEvent, AgendaEventStatus } from './agendaHelpers'

const FR_DAY_SHORT = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM']
// Fenêtre J → J+15 = 16 jours pendant lesquels une course manuelle peut être
// créée, modifiée ou supprimée. Au-delà, plus de saisie possible.
export const VISIBLE_DAYS = 16
export const MAX_OFFSET = VISIBLE_DAYS - 1

export interface AgendaDayGroup {
  key: string
  date: Date
  label: string
  events: AgendaEvent[]
  total: number
  count: number
}

export function useAgendaTab() {
  const { user } = useAuth()
  const router = useRouter()
  const missions = useDriverAgendaStore((s) => s.missions)
  const loading = useDriverAgendaStore((s) => s.isLoading && s.loadedFor === null)
  const storeError = useDriverAgendaStore((s) => s.error)
  const loadStore = useDriverAgendaStore((s) => s.load)
  const addMissionToStore = useDriverAgendaStore((s) => s.addMission)
  const removeMissionFromStore = useDriverAgendaStore((s) => s.removeMission)
  const updateMissionInStore = useDriverAgendaStore((s) => s.updateMission)
  const [selected, setSelected] = useState(new Date())
  const [nowTick, setNowTick] = useState(Date.now())
  const [showAddModal, setShowAddModal] = useState(false)
  const [addModalDate, setAddModalDate] = useState<Date | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  function addMission(m: Mission) {
    addMissionToStore(m)
    setSelected(new Date(m.scheduled_at))
  }

  function openDetails(id: string) {
    router.push(`/dashboard/chauffeur/mission/${id}`)
  }

  function openAddModalFor(date: Date) {
    setAddModalDate(date)
    setShowAddModal(true)
  }

  function closeAddModal() {
    setShowAddModal(false)
    setAddModalDate(null)
  }

  const actions = useAgendaActions(missions, removeMissionFromStore, setActionError)

  // Bornes de navigation : on ne saisit que dans [today ; today+MAX_OFFSET].
  const today = useMemo(() => startOfDay(new Date()), [nowTick])
  const maxDate = useMemo(() => addDays(today, MAX_OFFSET), [today])

  const weekStart = useMemo(() => startOfWeek(selected), [selected])
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i)
    const count = missions.filter((m) => sameDay(new Date(m.scheduled_at), d)).length
    const inWindow = d.getTime() >= today.getTime() && d.getTime() <= maxDate.getTime()
    return { date: d, dayShort: FR_DAY_SHORT[d.getDay()], count, key: d.toDateString(), disabled: !inWindow }
  }), [weekStart, missions, today, maxDate])

  const canPrevWeek = weekStart.getTime() > today.getTime()
  const canNextWeek = addDays(weekStart, 7).getTime() <= maxDate.getTime()

  function clamp(d: Date) {
    const t = d.getTime()
    if (t < today.getTime()) return today
    if (t > maxDate.getTime()) return maxDate
    return d
  }

  function goPrevWeek() {
    if (!canPrevWeek) return
    setSelected((s) => clamp(addDays(s, -7)))
  }

  function goNextWeek() {
    if (!canNextWeek) return
    setSelected((s) => clamp(addDays(s, 7)))
  }

  const weekRangeLabel = useMemo(() => {
    const start = weekDays[0].date
    const end = weekDays[6].date
    if (start.getMonth() === end.getMonth()) {
      const month = end.toLocaleDateString('fr-FR', { month: 'long' })
      return `Semaine du ${start.getDate()} au ${end.getDate()} ${month}`
    }
    const ms = start.toLocaleDateString('fr-FR', { month: 'long' })
    const me = end.toLocaleDateString('fr-FR', { month: 'long' })
    return `Semaine du ${start.getDate()} ${ms} au ${end.getDate()} ${me}`
  }, [weekDays])

  const planningTitle = useMemo(() => selected
    .toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric' })
    .toUpperCase(), [selected])

  const events = useMemo(() => {
    if (!user) return []
    return missions
      .filter((m) => sameDay(new Date(m.scheduled_at), selected))
      .map((m) => toEvent(m, user.id))
      .filter((e): e is NonNullable<typeof e> => e !== null)
      .sort((a, b) => a.start.getTime() - b.start.getTime())
  }, [missions, selected, user, nowTick])

  const stats = useMemo(() => ({
    count: events.length,
    total: events.reduce((s, e) => s + e.priceEur, 0),
    km: missions
      .filter((m) => sameDay(new Date(m.scheduled_at), selected))
      .reduce((s, m) => s + Number(m.distance_km ?? 0), 0),
  }), [events, missions, selected])

  // Vue multi-jours : VISIBLE_DAYS jours à partir d'aujourd'hui, chacun avec
  // ses events. Les jours vides sont conservés (tu peux y ajouter une course
  // manuellement).
  const daysGroups = useMemo<AgendaDayGroup[]>(() => {
    if (!user) return []
    const tomorrow = addDays(today, 1)
    return Array.from({ length: VISIBLE_DAYS }, (_, i) => {
      const d = addDays(today, i)
      const dayEvents = missions
        .filter((m) => sameDay(new Date(m.scheduled_at), d))
        .map((m) => toEvent(m, user.id))
        .filter((e): e is AgendaEvent => e !== null)
        .sort((a, b) => a.start.getTime() - b.start.getTime())
      return {
        key: d.toDateString(),
        date: d,
        label: agendaDayLabel(d, today, tomorrow),
        events: dayEvents,
        count: dayEvents.length,
        total: dayEvents.reduce((s, e) => s + e.priceEur, 0),
      }
    })
  }, [missions, user, nowTick])

  // Dismiss erreur affichee : clear l'actionError local + retry du load si le
  // store etait en erreur (sinon l'utilisateur n'a aucun moyen de reessayer).
  function dismissError() {
    setActionError(null)
    if (storeError && user) void loadStore(user.id, { force: true })
  }

  return {
    loading, error: storeError ?? actionError, dismissError, selected, setSelected,
    weekDays, weekRangeLabel, planningTitle, events, stats, daysGroups,
    showAddModal, setShowAddModal, addModalDate, openAddModalFor, closeAddModal,
    openDetails, addMission, removeMission: removeMissionFromStore, updateMission: updateMissionInStore,
    today, maxDate, canPrevWeek, canNextWeek, goPrevWeek, goNextWeek,
    ...actions,
  }
}
