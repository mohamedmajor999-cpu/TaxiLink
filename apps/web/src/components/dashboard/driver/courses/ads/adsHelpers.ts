import type { Mission } from '@/lib/supabase/types'
import { sameDay, addDays, startOfDay, agendaDayLabel } from '../agendaHelpers'

export type AdState = 'waiting' | 'accepted' | 'done'

export interface DriverProfile {
  full_name: string | null
  phone: string | null
}

export interface AdView {
  mission: Mission
  state: AdState
  driver: DriverProfile | null
}

export interface AdDayGroup {
  key: string
  date: Date
  label: string
  ads: AdView[]
  total: number
}

/**
 * État dérivé du status DB :
 *  AVAILABLE → waiting (personne ne l'a prise)
 *  IN_PROGRESS / ACCEPTED → accepted (un collègue l'a prise, course en cours)
 *  DONE → done (effectuée, prix réel posé)
 */
export function getAdState(m: Mission): AdState {
  if (m.status === 'AVAILABLE') return 'waiting'
  if (m.status === 'DONE') return 'done'
  return 'accepted'
}

/**
 * Estimation auto-déduite côté posteur : sans demander au preneur d'appuyer
 * sur des boutons supplémentaires, on calcule "où il en est" en se basant
 * sur enroute_at + temps de trajet théorique.
 *
 * - enroute_at posé → étape "en route"
 *   → après enroute_at + (durée trajet vers patient) → bascule à "patient à bord"
 * - pickup_at posé (rare en Phase 5 puisqu'on ne demande plus au preneur) → "patient à bord"
 *   → après pickup_at + (durée trajet vers destination) → bascule à "terminée"
 */
export type TrackerStep = 'accepted' | 'enroute' | 'onboard' | 'done'

export function deriveTrackerStep(m: Mission, now: number): TrackerStep {
  if (m.status === 'DONE' || m.dropoff_at) return 'done'
  if (m.pickup_at) return 'onboard'
  if (m.enroute_at) {
    const enrouteMs = new Date(m.enroute_at).getTime()
    const trajetPatientMs = (m.duration_min ?? 20) * 60_000
    if (now >= enrouteMs + trajetPatientMs) return 'onboard'
    return 'enroute'
  }
  return 'accepted'
}

/**
 * Construit les jours visibles : 3 jours passés (annonces effectuées récentes)
 * + aujourd'hui + 13 jours futurs. Total = 17 jours.
 */
export function buildAdDays(ads: AdView[]): AdDayGroup[] {
  const today = startOfDay(new Date())
  const tomorrow = addDays(today, 1)
  const start = addDays(today, -3)
  const groups: AdDayGroup[] = []
  for (let i = 0; i < 17; i++) {
    const d = addDays(start, i)
    const dayAds = ads
      .filter((a) => sameDay(new Date(a.mission.scheduled_at), d))
      .sort((a, b) => new Date(a.mission.scheduled_at).getTime() - new Date(b.mission.scheduled_at).getTime())
    if (dayAds.length === 0) continue // on n'affiche que les jours qui ont des annonces
    groups.push({
      key: d.toDateString(),
      date: d,
      label: agendaDayLabel(d, today, tomorrow),
      ads: dayAds,
      total: dayAds.reduce((s, a) => s + Number(a.mission.price_eur ?? 0), 0),
    })
  }
  return groups
}
