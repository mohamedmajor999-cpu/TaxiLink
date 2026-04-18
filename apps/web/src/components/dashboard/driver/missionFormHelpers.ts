import type { Mission } from '@/lib/supabase/types'
import type { MedicalMotif } from '@/lib/validators'

export type MissionFormType = 'CPAM' | 'PRIVE'

export function initialMedicalMotif(m: Mission | undefined): MedicalMotif | null {
  if (m?.medical_motif === 'HDJ' || m?.medical_motif === 'CONSULTATION') return m.medical_motif
  return null
}

export function defaultTime(): string {
  const d = new Date(Date.now() + 30 * 60_000)
  const m = Math.ceil(d.getMinutes() / 15) * 15
  d.setMinutes(m % 60, 0, 0)
  if (m >= 60) d.setHours(d.getHours() + 1)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatDateYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function defaultDate(): string {
  return formatDateYMD(new Date())
}

export function buildScheduledAt(date: string, time: string): string | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim())
  const timeMatch = /^(\d{1,2}):(\d{2})$/.exec(time.trim())
  if (!dateMatch || !timeMatch) return null
  const [, y, mo, da] = dateMatch
  const [, hh, mm] = timeMatch
  const h = Number(hh), m = Number(mm)
  if (h > 23 || m > 59) return null
  const d = new Date(Number(y), Number(mo) - 1, Number(da), h, m, 0, 0)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

export function timeFromMission(m: Mission | undefined): string {
  if (!m) return defaultTime()
  const d = new Date(m.scheduled_at)
  if (Number.isNaN(d.getTime())) return defaultTime()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function dateFromMission(m: Mission | undefined): string {
  if (!m) return defaultDate()
  const d = new Date(m.scheduled_at)
  if (Number.isNaN(d.getTime())) return defaultDate()
  return formatDateYMD(d)
}

export function initialType(m: Mission | undefined): MissionFormType {
  return m?.type === 'PRIVE' ? 'PRIVE' : 'CPAM'
}
