'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDriverAgendaStore } from '@/store/driverAgendaStore'

function startOfToday(): Date {
  const n = new Date()
  return new Date(n.getFullYear(), n.getMonth(), n.getDate())
}

function startOfTomorrow(): Date {
  const t = startOfToday()
  t.setDate(t.getDate() + 1)
  return t
}

export function useTodayTab() {
  const router = useRouter()
  const missions = useDriverAgendaStore((s) => s.missions)
  const loading = useDriverAgendaStore((s) => s.isLoading && s.loadedFor === null)
  const error = useDriverAgendaStore((s) => s.error)

  const openDetails = useCallback(
    (id: string) => router.push(`/dashboard/chauffeur/mission/${id}`),
    [router]
  )

  // Tick chaque minute : sert a 1) recalculer today/tomorrow quand on passe
  // minuit (sinon les courses d'hier restent visibles jusqu'au prochain
  // realtime event), 2) garantir refs stables pour les useMemo en dessous.
  const [nowTick, setNowTick] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  // Memoize sur nowTick pour stabiliser les refs : avant, today/tomorrow
  // etaient recreees a chaque render -> les useMemo en dessous etaient
  // invalides systematiquement (zero cache).
  const today = useMemo(() => startOfToday(), [nowTick])
  const tomorrow = useMemo(() => startOfTomorrow(), [nowTick])

  // Course "active" = celle que le chauffeur execute reellement (en route ou
  // patient a bord). Une mission tout juste acceptee mais sans horodatage de
  // depart reste dans la liste des courses du jour, meme si son status est
  // deja IN_PROGRESS, pour que les autres courses planifiees ne disparaissent
  // pas quand le chauffeur en accepte plusieurs.
  const current = useMemo(
    () => missions.find((m) => m.status === 'IN_PROGRESS' && (m.enroute_at || m.pickup_at)) ?? null,
    [missions],
  )

  // Toutes les missions du jour, sauf celle en cours d'execution. Pas de filtre
  // "overdue" ici : la borne de date suffit, et on veut continuer d'afficher
  // les courses passees de la matinee jusqu'a minuit (sinon le chauffeur perd
  // la trace de ses courses non encore marquees DONE).
  const upcomingToday = useMemo(() => {
    return missions
      .filter((m) =>
        m.id !== current?.id
        && new Date(m.scheduled_at).getTime() >= today.getTime()
        && new Date(m.scheduled_at).getTime() < tomorrow.getTime(),
      )
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
  }, [missions, today, tomorrow, current])

  const next = upcomingToday[0] ?? null
  const restOfDay = next ? upcomingToday.slice(1) : upcomingToday

  const todayTotal = upcomingToday.reduce((s, m) => s + Number(m.price_eur ?? 0), 0)

  return {
    loading, error,
    current,
    next,
    restOfDay,
    todayTotal,
    todayCount: upcomingToday.length,
    openDetails,
  }
}
