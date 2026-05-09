'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useMissionRealtime } from '@/hooks/useMissionRealtime'
import { usePostedAcceptStore } from '@/store/postedAcceptStore'
import { missionService } from '@/services/missionService'
import { profileService } from '@/services/profileService'
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
    // 30 jours en arrière + tout le futur. Le service inclut DONE pour
    // afficher les annonces effectuées dans le tracker des 3 derniers jours.
    const cutoff = new Date(Date.now() - 30 * 86_400_000).toISOString()
    try {
      const list = await missionService.getSharedByUser(uid, cutoff)
      setMissions(list)
      setError(null)

      const driverIds = Array.from(new Set(list.map((m) => m.driver_id).filter((id): id is string => !!id)))
      if (driverIds.length > 0) {
        const profs = await profileService.getContactsByIds(driverIds)
        const map: Record<string, DriverProfile> = {}
        for (const p of profs) map[p.id] = { full_name: p.full_name, phone: p.phone }
        setProfiles(map)
      } else {
        setProfiles({})
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { if (user) void load(user.id) }, [user, load])

  // Tick chaque minute pour rafraichir le tracker auto-déduit (estimations horaires).
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  // Patch-diff sur les events realtime : on ne refait pas un load() complet
  // (qui re-télécharge toutes les annonces + tous les profils), on ne touche
  // qu'à la mission concernée et on ajoute son driver au cache si besoin.
  const upsertOne = useCallback(async (id: string) => {
    const full = await missionService.getById(id)
    if (!full || full.shared_by !== user?.id) return
    setMissions((prev) => {
      const idx = prev.findIndex((m) => m.id === full.id)
      if (idx === -1) return [...prev, full]
      const next = [...prev]
      next[idx] = full
      return next
    })
    const driverId = full.driver_id
    if (driverId) {
      const profs = await profileService.getContactsByIds([driverId])
      const p = profs[0]
      if (p) {
        setProfiles((prev) => ({ ...prev, [p.id]: { full_name: p.full_name, phone: p.phone } }))
      }
    }
  }, [user])

  useMissionRealtime({
    onInsert: (m) => { if (user && m.shared_by === user.id) void upsertOne(m.id) },
    onUpdate: (m) => { if (user && m.shared_by === user.id) void upsertOne(m.id) },
    onDelete: ({ id }) => setMissions((prev) => prev.filter((m) => m.id !== id)),
  })

  const ads = useMemo<AdView[]>(() => {
    return missions.map((m) => ({
      mission: m,
      state: getAdState(m, nowTick),
      driver: m.driver_id ? profiles[m.driver_id] ?? null : null,
    }))
  }, [missions, profiles, nowTick])

  // Atterrissage auto sur le jour de l'annonce acceptée la plus recente non-vue,
  // pour que l'utilisateur arrive directement sur la bonne carte. Une seule
  // fois par session de "non-vu" : si on rejoue cet effet a chaque selection
  // manuelle, on bloque la navigation libre vers d'autres jours.
  const unseenIds = usePostedAcceptStore((s) => s.unseen)
  const focusedRef = useRef<string | null>(null)
  useEffect(() => {
    const ids = Object.keys(unseenIds)
    if (ids.length === 0) { focusedRef.current = null; return }
    const target = ads
      .filter((a) => a.state === 'accepted' && unseenIds[a.mission.id])
      .sort((x, y) => new Date(y.mission.accepted_at ?? 0).getTime() - new Date(x.mission.accepted_at ?? 0).getTime())[0]
    if (!target) return
    if (focusedRef.current === target.mission.id) return
    focusedRef.current = target.mission.id
    setSelected(new Date(target.mission.scheduled_at))
  }, [unseenIds, ads])

  const daysGroups = useMemo(() => buildAdDays(ads), [ads])

  const weekStart = useMemo(() => startOfWeek(selected), [selected])
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i)
    const count = ads.filter((a) => sameDay(new Date(a.mission.scheduled_at), d)).length
    return { date: d, dayShort: FR_DAY_SHORT[d.getDay()], count, key: d.toDateString() }
  }), [weekStart, ads])

  // Bornes de navigation semaine : 30 j en arrière (cutoff de chargement) → +60 j devant.
  const minWeekStart = useMemo(() => startOfWeek(addDays(new Date(), -30)), [nowTick])
  const maxWeekStart = useMemo(() => startOfWeek(addDays(new Date(), 60)), [nowTick])
  const canPrevWeek = weekStart.getTime() > minWeekStart.getTime()
  const canNextWeek = weekStart.getTime() < maxWeekStart.getTime()
  const goPrevWeek = useCallback(() => {
    if (!canPrevWeek) return
    setSelected((s) => addDays(s, -7))
  }, [canPrevWeek])
  const goNextWeek = useCallback(() => {
    if (!canNextWeek) return
    setSelected((s) => addDays(s, 7))
  }, [canNextWeek])

  const counts = useMemo(() => ({
    waiting: ads.filter((a) => a.state === 'waiting').length,
    expired: ads.filter((a) => a.state === 'expired').length,
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
    canPrevWeek, canNextWeek, goPrevWeek, goNextWeek,
  }
}
