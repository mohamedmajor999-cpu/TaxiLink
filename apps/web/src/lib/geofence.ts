// Logique pure pour le geofencing :
// 1) calcul de distance Haversine entre 2 points GPS
// 2) machine a etats "dwell" : detecter qu'un mobile reste dans un rayon
//    pendant N millisecondes consecutives (anti-faux-positif sur jitter GPS).
//
// Volontairement sans dependances ni effets de bord — entierement testable.

export interface LatLng {
  lat: number
  lng: number
}

const EARTH_RADIUS_M = 6_371_000

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/** Distance entre 2 coordonnees GPS, en metres. */
export function haversineMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h))
}

export type DwellPhase = 'outside' | 'entering' | 'confirmed'

export interface DwellState {
  phase: DwellPhase
  // Timestamp (ms) ou la cible est entree dans le rayon. Reset des qu'elle
  // sort. Sert a calculer la duree d'attente avant confirmation.
  enteredAt: number | null
}

export const INITIAL_DWELL: DwellState = { phase: 'outside', enteredAt: null }

interface UpdateInput {
  state: DwellState
  isInside: boolean   // distance courante <= radius
  now: number         // timestamp ms
  dwellMs: number     // duree minimale dans la zone avant 'confirmed'
}

/**
 * Reduce la machine a etats. La transition vers 'confirmed' n'est rendue
 * qu'une seule fois — le consommateur peut detecter la confirmation via
 * `prev.phase !== 'confirmed' && next.phase === 'confirmed'`.
 */
export function reduceDwell({ state, isInside, now, dwellMs }: UpdateInput): DwellState {
  if (!isInside) return INITIAL_DWELL

  // Premiere entree dans la zone
  if (state.phase === 'outside' || state.enteredAt === null) {
    return { phase: 'entering', enteredAt: now }
  }

  // Toujours dans la zone — voir si on a tenu assez longtemps
  const elapsed = now - state.enteredAt
  if (state.phase === 'entering' && elapsed >= dwellMs) {
    return { phase: 'confirmed', enteredAt: state.enteredAt }
  }

  return state
}

/** Helper pratique pour combiner haversine + reduceDwell en une seule etape. */
export function checkGeofence(params: {
  state: DwellState
  position: LatLng
  target: LatLng
  radiusM: number
  dwellMs: number
  now: number
}): { state: DwellState; distanceM: number; justConfirmed: boolean } {
  const distanceM = haversineMeters(params.position, params.target)
  const isInside = distanceM <= params.radiusM
  const next = reduceDwell({
    state: params.state,
    isInside,
    now: params.now,
    dwellMs: params.dwellMs,
  })
  const justConfirmed = params.state.phase !== 'confirmed' && next.phase === 'confirmed'
  return { state: next, distanceM, justConfirmed }
}
