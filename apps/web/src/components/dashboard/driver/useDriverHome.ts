'use client'
import { useMemo, useState } from 'react'
import type { Mission } from '@/lib/supabase/types'
import { useDriverStore } from '@/store/driverStore'
import { useDriverMissions } from './useDriverMissions'
import type { CourseCardData } from '@/components/taxilink/CourseCard'
import type { RideBadgeVariant } from '@/components/taxilink/RideBadge'

export type HomeFilter = 'ALL' | 'CPAM' | 'PRIVE' | 'TAXILINK'

export const HOME_FILTERS: { key: HomeFilter; label: string }[] = [
  { key: 'ALL', label: 'Tout' },
  { key: 'CPAM', label: 'Médical' },
  { key: 'PRIVE', label: 'Privé' },
  { key: 'TAXILINK', label: 'TaxiLink' },
]

const TYPE_BADGE: Record<string, { variant: RideBadgeVariant; label: string }> = {
  CPAM: { variant: 'medical', label: 'Médical' },
  PRIVE: { variant: 'private', label: 'Privé' },
  TAXILINK: { variant: 'fleet', label: 'TaxiLink' },
}

const PAYMENT_FROM_TYPE: Record<string, 'CPAM' | 'CB' | 'Espèces'> = {
  CPAM: 'CPAM',
  PRIVE: 'CB',
  TAXILINK: 'CB',
}

function toCourseCard(m: Mission): CourseCardData {
  const scheduled = new Date(m.scheduled_at)
  const minutesAhead = Math.round((scheduled.getTime() - Date.now()) / 60_000)
  const urgent = m.type === 'CPAM' && minutesAhead >= 0 && minutesAhead <= 5
  const badge = TYPE_BADGE[m.type] ?? TYPE_BADGE.PRIVE
  return {
    id: m.id,
    urgent: urgent ? { etaMin: Math.max(minutesAhead, 1) } : undefined,
    badges: [badge],
    postedBy: { initials: '··', name: 'Membre' },
    from: { name: m.departure },
    to: { name: m.destination },
    distanceKm: m.distance_km ?? 0,
    durationMin: Math.max(Math.round((m.distance_km ?? 0) * 2.2), 5),
    payment: PAYMENT_FROM_TYPE[m.type] ?? 'CB',
    priceEur: Number(m.price_eur ?? 0),
  }
}

export function useDriverHome() {
  const driver = useDriverStore((s) => s.driver)
  const missions = useDriverMissions()
  const [filter, setFilter] = useState<HomeFilter>('ALL')

  const filtered = useMemo(() => {
    if (filter === 'ALL') return missions.missions
    return missions.missions.filter((m) => m.type === filter)
  }, [missions.missions, filter])

  const cards = useMemo<CourseCardData[]>(() => filtered.map(toCourseCard), [filtered])

  const counts = useMemo(() => {
    const byType: Record<HomeFilter, number> = { ALL: missions.missions.length, CPAM: 0, PRIVE: 0, TAXILINK: 0 }
    for (const m of missions.missions) {
      if (m.type in byType) byType[m.type as HomeFilter]++
    }
    return byType
  }, [missions.missions])

  const firstName = driver.name?.split(' ')[0] ?? 'Chauffeur'

  return {
    driver,
    firstName,
    cards,
    counts,
    filter,
    setFilter,
    loading: missions.loading,
    error: missions.error,
    accepting: missions.accepting,
    acceptMission: missions.acceptMission,
    toasts: missions.toasts,
    dismissToast: missions.dismissToast,
  }
}
