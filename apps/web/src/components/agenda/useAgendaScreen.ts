'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { missionService } from '@/services/missionService'
import { missionToAgendaRide } from '@/lib/missionMapper'
import { isSameDay } from '@/lib/utils'
import type { AgendaRide } from '@taxilink/core'

type View = 'jour' | 'semaine'

function computeStats(rides: AgendaRide[]) {
  return {
    rides: rides.length,
    km: rides.reduce((s, r) => s + r.distanceKm, 0),
    earnings: rides.reduce((s, r) => s + r.priceEur, 0),
  }
}

export function useAgendaScreen() {
  const { user } = useAuth()
  const [allRides, setAllRides] = useState<AgendaRide[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<View>('jour')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [weekOffset, setWeekOffset] = useState(0)

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  useEffect(() => {
    if (!user) return
    setLoading(true)
    missionService.getAgenda(user.id)
      .then((data) => setAllRides(data.map(missionToAgendaRide)))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [user])

  const weekDays = useMemo(() => {
    const base = new Date(today)
    base.setDate(base.getDate() + weekOffset * 7)
    const monday = new Date(base)
    monday.setDate(base.getDate() - ((base.getDay() + 6) % 7))
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      return d
    })
  }, [today, weekOffset])

  const ridesForDay = (date: Date) =>
    allRides.filter((r) => isSameDay(new Date(r.scheduledAt), date))

  const ridesForSelected = ridesForDay(selectedDate)
  const ridesForWeek = weekDays.flatMap((d) => ridesForDay(d))

  const dayStats = useMemo(() => computeStats(ridesForSelected), [ridesForSelected])
  const weekStats = useMemo(() => computeStats(ridesForWeek), [ridesForWeek])

  const prevDay = () =>
    setSelectedDate((d) => { const n = new Date(d); n.setDate(n.getDate() - 1); return n })
  const nextDay = () =>
    setSelectedDate((d) => { const n = new Date(d); n.setDate(n.getDate() + 1); return n })

  return {
    view, setView,
    selectedDate, setSelectedDate,
    weekOffset, setWeekOffset,
    today, weekDays,
    ridesForDay, ridesForSelected, ridesForWeek,
    dayStats, weekStats,
    prevDay, nextDay,
    loading, error,
  }
}
