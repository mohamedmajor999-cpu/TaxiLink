'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useMissionRealtime } from '@/hooks/useMissionRealtime'
import { sameDay } from '../agendaHelpers'
import { buildAdDays, getAdState, type AdView, type DriverProfile } from './adsHelpers'
import type { Mission } from '@/lib/supabase/types'

const FR_DAY_SHORT = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM']

function startOfWeek(d: Date): Date {
  const r = new Date(d)
  const day = r.getDay()
  const diff = day === 0 ? -6 : 1 - day
  r.setDate(r.getDate() + diff)
  r.setHours(0, 0, 0, 0)
  return r
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

export function useAdsTab() {
  const { user } = useAuth()
  const [missions, setMissions] = useState<Mission[]>([])
  const [profiles, setProfiles] = useState<Record<string, DriverProfile>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState(new Date())
  const [nowTick, setNowTick] = useState(Date.now())

  const load = useCallback(async (uid: string) => {
    const supabase = createClient()
    // 30 jours en arrière + tout le futur. Pas de filtre status → on inclut DONE
    // pour afficher les annonces effectuées dans le tracker des 3 derniers jours.
    const cutoff = new Date(Date.now() - 30 * 86_400_000).toISOString()
    const { data, error: e } = await supabase
      .from('missions')
      .select('*')
      .eq('shared_by', uid)
      .gte('scheduled_at', cutoff)
      .order('scheduled_at', { ascending: true })
    if (e) { setError(e.message); setLoading(false); return }
    const list = data ?? []
    setMissions(list)
    setError(null)

    const driverIds = Array.from(new Set(list.map((m) => m.driver_id).filter((id): id is string => !!id)))
    if (driverIds.length > 0) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .in('id', driverIds)
      const map: Record<string, DriverProfile> = {}
      for (const p of profs ?? []) map[p.id] = { full_name: p.full_name, phone: p.phone }
      setProfiles(map)
    } else {
      setProfiles({})
    }
    setLoading(false)
  }, [])

  useEffect(() => { if (user) void load(user.id) }, [user, load])

  // Tick chaque minute pour rafraichir le tracker auto-déduit (estimations horaires).
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  useMissionRealtime({
    onInsert: (m) => { if (user && m.shared_by === user.id) void load(user.id) },
    onUpdate: (m) => { if (user && m.shared_by === user.id) void load(user.id) },
  })

  const ads = useMemo<AdView[]>(() => {
    return missions.map((m) => ({
      mission: m,
      state: getAdState(m),
      driver: m.driver_id ? profiles[m.driver_id] ?? null : null,
    }))
  }, [missions, profiles])

  const daysGroups = useMemo(() => buildAdDays(ads), [ads])

  const weekStart = useMemo(() => startOfWeek(selected), [selected])
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i)
    const count = ads.filter((a) => sameDay(new Date(a.mission.scheduled_at), d)).length
    return { date: d, dayShort: FR_DAY_SHORT[d.getDay()], count, key: d.toDateString() }
  }), [weekStart, ads])

  const counts = useMemo(() => ({
    waiting: ads.filter((a) => a.state === 'waiting').length,
    accepted: ads.filter((a) => a.state === 'accepted').length,
    done: ads.filter((a) => a.state === 'done').length,
  }), [ads])

  return {
    loading, error,
    selected, setSelected,
    weekDays,
    daysGroups,
    counts,
    nowTick,
  }
}
