export interface OsrmRoute {
  geometry: GeoJSON.LineString
  durationSec: number
  distanceM: number
}

interface FetchParams {
  from: { lat: number; lng: number }
  to: { lat: number; lng: number }
  signal?: AbortSignal
}

/**
 * Récupère un itinéraire routier via OSRM public demo (sans trafic temps réel).
 * Retourne la géométrie GeoJSON complète pour le tracé sur la carte, plus
 * distance et durée théoriques.
 */
export async function fetchOsrmRoute(params: FetchParams): Promise<OsrmRoute | null> {
  const { from, to, signal } = params
  const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`
  try {
    const res = await fetch(url, { signal })
    if (!res.ok) return null
    const json = await res.json()
    const route = json.routes?.[0]
    if (!route?.geometry) return null
    return {
      geometry: route.geometry as GeoJSON.LineString,
      durationSec: Math.round(route.duration),
      distanceM: Math.round(route.distance),
    }
  } catch {
    return null
  }
}
