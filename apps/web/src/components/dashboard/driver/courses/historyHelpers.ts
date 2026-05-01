import type { Mission } from '@/lib/supabase/types'
import { computeDisplayFare } from '@/lib/missionFare'

export type Period = 'week' | 'month' | 'quarter' | 'all'
export type HistoryTypeFilter = 'ALL' | 'CPAM' | 'PRIVE'

export interface MonthGroup {
  key: string
  label: string
  total: number
  missions: Mission[]
}

const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

export function fareValue(m: Mission): number {
  return computeDisplayFare(m).value
}

export function filterByPeriod(missions: Mission[], period: Period): Mission[] {
  if (period === 'all') return missions
  const now = Date.now()
  const days = period === 'week' ? 7 : period === 'month' ? 30 : 90
  const ms = days * 24 * 3600 * 1000
  return missions.filter((m) => {
    const d = new Date(m.completed_at ?? m.scheduled_at).getTime()
    return now - d <= ms
  })
}

export function filterByType(missions: Mission[], type: HistoryTypeFilter): Mission[] {
  if (type === 'ALL') return missions
  return missions.filter((m) => m.type === type)
}

export function filterByQuery(missions: Mission[], query: string): Mission[] {
  const q = query.trim().toLowerCase()
  if (!q) return missions
  return missions.filter((m) => {
    const haystack = [m.patient_name, m.departure, m.destination, m.medical_motif, m.notes]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return haystack.includes(q)
  })
}

export function buildGroups(missions: Mission[]): MonthGroup[] {
  const map = new Map<string, Mission[]>()
  for (const m of missions) {
    const d = new Date(m.completed_at ?? m.scheduled_at)
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`
    const list = map.get(key) ?? []
    list.push(m)
    map.set(key, list)
  }
  return Array.from(map.entries())
    .map(([key, list]) => {
      const d = new Date(list[0].completed_at ?? list[0].scheduled_at)
      return {
        key,
        label: `${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`.toUpperCase(),
        total: list.reduce((s, m) => s + fareValue(m), 0),
        missions: list,
      }
    })
    .sort((a, b) => b.key.localeCompare(a.key))
}

export function exportCsv(missions: Mission[]) {
  const header = 'Date,Départ,Destination,Type,Prix (€),Distance (km)'
  const rows = missions.map((m) =>
    [
      new Date(m.completed_at ?? m.scheduled_at).toLocaleDateString('fr-FR'),
      `"${m.departure}"`,
      `"${m.destination}"`,
      m.type,
      fareValue(m),
      m.distance_km ?? 0,
    ].join(',')
  )
  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'courses-taxilink.csv'
  a.click()
  URL.revokeObjectURL(url)
}
