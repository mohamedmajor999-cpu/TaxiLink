import type { AgendaBlock, AgendaDriverRow, UnassignedCourse } from '@/services/patronAgendaService'
import type { PatronFleetMember } from '@/services/patronFleetService'

export interface DispatchSuggestion {
  courseId: string
  driverId: string | null  // null = aucun chauffeur disponible
  score: number            // 0-100
  reasons: string[]
}

interface DispatchInput {
  courses: UnassignedCourse[]
  drivers: PatronFleetMember[]
  rows: AgendaDriverRow[]  // agenda du jour de chaque chauffeur
}

const BUFFER_HOURS_BEFORE = 0.5  // 30 min de marge avant la course
const BUFFER_HOURS_AFTER = 0.25  // 15 min après

// Algorithme glouton :
// - Trie les courses par scheduled_at croissant
// - Pour chaque course : score chaque chauffeur sur (libre, distance, charge)
// - Garde le meilleur, le marque "occupé" sur la plage horaire pour les suivantes
export function dispatch({ courses, drivers, rows }: DispatchInput): DispatchSuggestion[] {
  const sortedCourses = [...courses].sort((a, b) => a.startH - b.startH)
  const blocksByDriver = new Map<string, AgendaBlock[]>()
  for (const r of rows) blocksByDriver.set(r.driverId, [...r.blocks])
  const loadByDriver = new Map<string, number>()
  for (const r of rows) loadByDriver.set(r.driverId, r.blocks.length)

  const suggestions: DispatchSuggestion[] = []

  for (const c of sortedCourses) {
    let best: { driver: PatronFleetMember; score: number; reasons: string[] } | null = null

    for (const d of drivers) {
      const blocks = blocksByDriver.get(d.id) ?? []
      const conflict = hasConflict(blocks, c.startH, c.endH)
      if (conflict) continue

      const load = loadByDriver.get(d.id) ?? 0
      const distanceKm = computeDistance(d, c)
      const reasons: string[] = ['✓ Libre']
      let score = 60  // base score si libre

      if (distanceKm != null) {
        // Plus proche = meilleur. 0 km = +30 pts, 30+ km = 0 pts.
        const distScore = Math.max(0, 30 - distanceKm)
        score += distScore
        reasons.push(`${distanceKm.toFixed(1)} km`)
      } else {
        reasons.push('position inconnue')
      }

      // Anti-surcharge : 0 course aujourd'hui = +10, 5+ courses = 0
      const loadScore = Math.max(0, 10 - load * 2)
      score += loadScore
      reasons.push(`${load} course${load > 1 ? 's' : ''} aujourd'hui`)

      if (!best || score > best.score) {
        best = { driver: d, score: Math.round(score), reasons }
      }
    }

    if (best) {
      // Marque le chauffeur occupé sur cette plage pour les courses suivantes
      const blocks = blocksByDriver.get(best.driver.id) ?? []
      blocks.push({
        id: `pending-${c.id}`,
        startH: c.startH,
        endH: c.endH,
        label: c.departure,
        type: c.type,
        status: 'planned',
      })
      blocksByDriver.set(best.driver.id, blocks)
      loadByDriver.set(best.driver.id, (loadByDriver.get(best.driver.id) ?? 0) + 1)

      suggestions.push({
        courseId: c.id,
        driverId: best.driver.id,
        score: best.score,
        reasons: best.reasons,
      })
    } else {
      suggestions.push({
        courseId: c.id,
        driverId: null,
        score: 0,
        reasons: ['Aucun chauffeur libre sur ce créneau'],
      })
    }
  }

  return suggestions
}

// Conflit si la plage [start - bufBefore, end + bufAfter] chevauche un block existant
function hasConflict(blocks: AgendaBlock[], startH: number, endH: number): boolean {
  const a = startH - BUFFER_HOURS_BEFORE
  const b = endH + BUFFER_HOURS_AFTER
  return blocks.some((bl) => !(b <= bl.startH || a >= bl.endH))
}

// Distance Haversine en km (approx). Retourne null si une coord manque.
function computeDistance(d: PatronFleetMember, c: UnassignedCourse): number | null {
  if (d.lat == null || d.lng == null || c.departure_lat == null || c.departure_lng == null) return null
  const R = 6371
  const dLat = toRad(c.departure_lat - d.lat)
  const dLng = toRad(c.departure_lng - d.lng)
  const lat1 = toRad(d.lat)
  const lat2 = toRad(c.departure_lat)
  const x = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  return 2 * R * Math.asin(Math.sqrt(x))
}

function toRad(deg: number): number { return (deg * Math.PI) / 180 }
