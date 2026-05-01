import type { Mission } from '@/lib/supabase/types'
import { computeDisplayFare } from '@/lib/missionFare'

// Annonces qui partagent exactement la meme adresse de depart (ex: hopital,
// clinique) sont regroupees dans un seul "stack pin" pour eviter la
// superposition. Le pin affiche le prix le plus eleve (offre la plus
// attractive) + badge "+N-1" pour les autres. Au tap : selection du leader.

const COORD_PRECISION = 5 // ~1m en degres lat/lng

export type MissionCluster =
  | { type: 'pin'; mission: Mission; position: [number, number] }
  | { type: 'stack'; leader: Mission; missions: Mission[]; position: [number, number] }

export function clusterMissions(missions: Mission[]): MissionCluster[] {
  const groups = new Map<string, Mission[]>()
  for (const m of missions) {
    if (m.departure_lat == null || m.departure_lng == null) continue
    const key = `${m.departure_lat.toFixed(COORD_PRECISION)}|${m.departure_lng.toFixed(COORD_PRECISION)}`
    const arr = groups.get(key)
    if (arr) arr.push(m)
    else groups.set(key, [m])
  }
  const out: MissionCluster[] = []
  groups.forEach((arr) => {
    const lat = arr[0]!.departure_lat as number
    const lng = arr[0]!.departure_lng as number
    if (arr.length === 1) {
      out.push({ type: 'pin', mission: arr[0]!, position: [lat, lng] })
      return
    }
    // Tri prix decroissant : leader = offre la plus rentable. Tie-break par id
    // pour stabilite (memes annonces → meme leader → meme rendu).
    const sorted = [...arr].sort((a, b) => {
      const fa = computeDisplayFare(a).value
      const fb = computeDisplayFare(b).value
      if (fa !== fb) return fb - fa
      return a.id.localeCompare(b.id)
    })
    out.push({ type: 'stack', leader: sorted[0]!, missions: sorted, position: [lat, lng] })
  })
  return out
}
