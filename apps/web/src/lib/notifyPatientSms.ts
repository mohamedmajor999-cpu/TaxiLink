import { formatTime } from './dateUtils'
import type { Mission } from './supabase/types'

type Sliced = Pick<Mission, 'phone' | 'patient_name' | 'scheduled_at'>

export function buildPatientSmsBody(mission: Sliced): string {
  const name = mission.patient_name?.trim()
  const greeting = name ? `Bonjour ${name}` : 'Bonjour'
  const time = formatTime(mission.scheduled_at)
  return `${greeting}, votre taxi est en route, arrivée prévue vers ${time}.`
}

export function notifyPatientSms(mission: Sliced): void {
  if (typeof window === 'undefined' || !mission.phone) return
  const phone = mission.phone.replace(/\s/g, '')
  const body = buildPatientSmsBody(mission)
  window.open(`sms:${phone}?body=${encodeURIComponent(body)}`, '_self')
}
