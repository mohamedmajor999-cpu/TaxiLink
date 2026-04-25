import type { Mission } from '@/lib/supabase/types'

// Quand plusieurs annonces partagent la meme adresse (ex: hopital, clinique),
// leurs pins se superposent et certains deviennent inaccessibles meme avec zoom max.
// Solution : grouper par coordonnees (precision ~1m) et placer chaque pin du
// groupe sur un cercle autour du centre. Un pin reste pile sur la position si seul.

const COORD_PRECISION = 5 // ~1m en degres lat/lng
const RADIUS_DEG_LAT = 0.00035 // ~39m, separation visible des le zoom 13
const DEG = Math.PI / 180

export function computeMarkerPositions(missions: Mission[]): Map<string, [number, number]> {
  const groups = new Map<string, Mission[]>()
  for (const m of missions) {
    if (m.departure_lat == null || m.departure_lng == null) continue
    const key = `${m.departure_lat.toFixed(COORD_PRECISION)}|${m.departure_lng.toFixed(COORD_PRECISION)}`
    const arr = groups.get(key)
    if (arr) arr.push(m)
    else groups.set(key, [m])
  }
  const out = new Map<string, [number, number]>()
  groups.forEach((arr) => {
    if (arr.length === 1) {
      const m = arr[0]!
      out.set(m.id, [m.departure_lat as number, m.departure_lng as number])
      return
    }
    // Placement uniforme sur un cercle. Tri par id pour stabilite (memes pins, memes places).
    const sorted = [...arr].sort((a, b) => a.id.localeCompare(b.id))
    const lat0 = sorted[0]!.departure_lat as number
    const lng0 = sorted[0]!.departure_lng as number
    const lngScale = 1 / Math.max(0.01, Math.cos(lat0 * DEG))
    sorted.forEach((m, i) => {
      const a = (2 * Math.PI * i) / sorted.length
      out.set(m.id, [
        lat0 + RADIUS_DEG_LAT * Math.sin(a),
        lng0 + RADIUS_DEG_LAT * Math.cos(a) * lngScale,
      ])
    })
  })
  return out
}
