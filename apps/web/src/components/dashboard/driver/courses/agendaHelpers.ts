import type { Mission } from '@/lib/supabase/types'

export type AgendaEventStatus = 'completed' | 'now' | 'scheduled' | 'manual'

export interface AgendaEvent {
  id: string
  start: Date
  end: Date
  status: AgendaEventStatus
  type: 'CPAM' | 'PRIVE' | 'TAXILINK'
  from: string
  to: string
  priceEur: number
  isManual: boolean
  patientName: string | null
  returnTrip: boolean
}

export function sameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString()
}

export function addDays(d: Date, n: number) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

export function startOfDay(d: Date): Date {
  const r = new Date(d)
  r.setHours(0, 0, 0, 0)
  return r
}

export function startOfWeek(d: Date): Date {
  const r = new Date(d)
  const day = r.getDay()
  const diff = day === 0 ? -6 : 1 - day // ramene au lundi
  r.setDate(r.getDate() + diff)
  r.setHours(0, 0, 0, 0)
  return r
}

export function agendaDayLabel(d: Date, today: Date, tomorrow: Date): string {
  const dayMonth = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
  if (sameDay(d, today)) return `Aujourd'hui · ${dayMonth}`
  if (sameDay(d, tomorrow)) return `Demain · ${dayMonth}`
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function toEvent(m: Mission, _userId: string): AgendaEvent | null {
  const start = new Date(m.scheduled_at)
  const durationMin = Math.max(m.duration_min ?? Math.round((m.distance_km ?? 0) * 2.2), 15)
  const end = new Date(start.getTime() + durationMin * 60_000)
  const now = Date.now()
  const isManual = m.shared_by === null && m.client_id === null && m.status === 'ACCEPTED'
  const isCompleted = m.status === 'DONE' || end.getTime() < now
  const isNow = start.getTime() <= now && end.getTime() >= now && !isCompleted

  const status: AgendaEventStatus = isNow ? 'now'
    : isCompleted ? 'completed'
    : isManual ? 'manual'
    : 'scheduled'

  return {
    id: m.id,
    start, end, status,
    type: (['CPAM', 'PRIVE', 'TAXILINK'].includes(m.type) ? m.type : 'PRIVE') as AgendaEvent['type'],
    from: m.departure,
    to: m.destination,
    priceEur: Number(m.price_eur ?? 0),
    isManual,
    patientName: m.patient_name,
    returnTrip: m.return_trip,
  }
}
