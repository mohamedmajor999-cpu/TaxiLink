import type { Mission } from '@/lib/supabase/types'

export type MissionFormType = 'CPAM' | 'PRIVE'

export function defaultTime(): string {
  const d = new Date(Date.now() + 30 * 60_000)
  const m = Math.ceil(d.getMinutes() / 15) * 15
  d.setMinutes(m % 60, 0, 0)
  if (m >= 60) d.setHours(d.getHours() + 1)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function buildScheduledAt(time: string, reference?: string): string | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim())
  if (!match) return null
  const [, hh, mm] = match
  const h = Number(hh), m = Number(mm)
  if (h > 23 || m > 59) return null
  const d = reference ? new Date(reference) : new Date()
  if (Number.isNaN(d.getTime())) return null
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

export function timeFromMission(m: Mission | undefined): string {
  if (!m) return defaultTime()
  const d = new Date(m.scheduled_at)
  if (Number.isNaN(d.getTime())) return defaultTime()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function initialType(m: Mission | undefined): MissionFormType {
  return m?.type === 'PRIVE' ? 'PRIVE' : 'CPAM'
}
