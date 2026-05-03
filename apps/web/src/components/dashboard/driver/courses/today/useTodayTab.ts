'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { missionService } from '@/services/missionService'
import type { Mission } from '@/lib/supabase/types'

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
  const { user } = useAuth()
  const router = useRouter()
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const openDetails = useCallback(
    (id: string) => router.push(`/dashboard/chauffeur/mission/${id}`),
    [router]
  )

  useEffect(() => {
    if (!user) return
    missionService.getAgenda(user.id)
      .then(setMissions)
      .catch((e) => setError(e instanceof Error ? e.message : 'Erreur'))
      .finally(() => setLoading(false))
  }, [user])

  const today = startOfToday()
  const tomorrow = startOfTomorrow()

  const current = useMemo(
    () => missions.find((m) => m.status === 'IN_PROGRESS') ?? null,
    [missions],
  )

  // Toutes les missions du jour, status != IN_PROGRESS. Pas de filtre "overdue"
  // ici : la borne de date suffit, et on veut continuer d'afficher les courses
  // passees de la matinee jusqu'a minuit (sinon le chauffeur perd la trace de
  // ses courses non encore marquees DONE).
  const upcomingToday = useMemo(() => {
    return missions
      .filter((m) =>
        m.status !== 'IN_PROGRESS'
        && new Date(m.scheduled_at).getTime() >= today.getTime()
        && new Date(m.scheduled_at).getTime() < tomorrow.getTime(),
      )
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
  }, [missions, today, tomorrow])

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
