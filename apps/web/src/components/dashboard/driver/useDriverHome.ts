'use client'
import { useMemo, useState } from 'react'
import type { Mission } from '@/lib/supabase/types'
import { useDriverStore } from '@/store/driverStore'
import { useDriverMissions } from './useDriverMissions'
import type { CourseCardData } from '@/components/taxilink/CourseCard'
import type { RideBadgeVariant } from '@/components/taxilink/RideBadge'

export type HomeTypeFilter = 'ALL' | 'CPAM' | 'PRIVE'
export type HomeGroupFilter = 'taxi13' | 'allo' | 'public'

export const HOME_TYPE_FILTERS: { key: HomeTypeFilter; label: string }[] = [
  { key: 'ALL', label: 'Tout' },
  { key: 'CPAM', label: 'Médical' },
  { key: 'PRIVE', label: 'Privé' },
]

export const HOME_GROUP_FILTERS: { key: HomeGroupFilter; label: string }[] = [
  { key: 'taxi13', label: 'Taxi13' },
  { key: 'allo', label: 'Allo Taxi Marseille' },
  { key: 'public', label: 'Public' },
]

const TYPE_BADGE: Record<string, { variant: RideBadgeVariant; label: string }> = {
  CPAM: { variant: 'medical', label: 'Médical' },
  PRIVE: { variant: 'private', label: 'Privé' },
  TAXILINK: { variant: 'fleet', label: 'TaxiLink' },
}

const PAYMENT_FROM_TYPE: Record<string, 'CPAM' | 'CB' | 'Espèces'> = {
  CPAM: 'CPAM',
  PRIVE: 'Espèces',
  TAXILINK: 'CB',
}

function fmtClient(m: Mission): string {
  const raw = 'patient_name' in m && typeof m.patient_name === 'string' ? m.patient_name.trim() : ''
  if (!raw) return 'Client'
  const parts = raw.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[1][0]}.`
}

function toCourseCard(m: Mission): CourseCardData {
  const scheduled = new Date(m.scheduled_at)
  const minutesAhead = Math.round((scheduled.getTime() - Date.now()) / 60_000)
  const isUrgent = m.type === 'CPAM' && minutesAhead >= 0 && minutesAhead <= 5
  const badge = TYPE_BADGE[m.type] ?? TYPE_BADGE.PRIVE
  return {
    id: m.id,
    urgent: isUrgent ? { etaMin: Math.max(minutesAhead, 1) } : undefined,
    scheduledInMin: minutesAhead,
    clientName: fmtClient(m),
    badges: [badge, { variant: 'fleet', label: 'Taxi13' }],
    from: { name: m.departure },
    to: { name: m.destination },
    distanceKm: m.distance_km ?? 0,
    durationMin: Math.max(Math.round((m.distance_km ?? 0) * 2.2), 5),
    payment: PAYMENT_FROM_TYPE[m.type] ?? 'Espèces',
    priceEur: Number(m.price_eur ?? 0),
  }
}

export function useDriverHome() {
  const driver = useDriverStore((s) => s.driver)
  const setOnline = useDriverStore((s) => s.setOnline)
  const m = useDriverMissions()
  const [filter, setFilter] = useState<HomeTypeFilter>('ALL')
  const [group, setGroup] = useState<HomeGroupFilter>('taxi13')

  const filtered = useMemo(() => {
    if (filter === 'ALL') return m.missions
    return m.missions.filter((x) => x.type === filter)
  }, [m.missions, filter])

  const cards = useMemo<CourseCardData[]>(() => filtered.map(toCourseCard), [filtered])

  const counts = useMemo(() => {
    const c: Record<HomeTypeFilter, number> = { ALL: m.missions.length, CPAM: 0, PRIVE: 0 }
    for (const x of m.missions) {
      if (x.type === 'CPAM') c.CPAM++
      else if (x.type === 'PRIVE') c.PRIVE++
    }
    return c
  }, [m.missions])

  const initials =
    (driver.name || '')
      .split(' ')
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'YB'

  return {
    driver,
    setOnline,
    initials,
    city: 'Marseille',
    postalCode: '13008',
    nearbyZone: 'Vieux-Port',
    cards,
    counts,
    filter,
    setFilter,
    group,
    setGroup,
    loading: m.loading,
    error: m.error,
    acceptMission: m.acceptMission,
  }
}
