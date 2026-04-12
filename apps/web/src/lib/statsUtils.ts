import type { Mission } from '@/lib/supabase/types'

export function computeStats(missions: Mission[]) {
  return {
    rides: missions.length,
    km: missions.reduce((s, m) => s + (m.distance_km ?? 0), 0),
    earnings: missions.reduce((s, m) => s + (m.price_eur ?? 0), 0),
  }
}
