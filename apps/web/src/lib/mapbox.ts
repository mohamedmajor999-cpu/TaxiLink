export interface TrafficEstimate {
  durationSec: number
  distanceM: number
}

interface FetchParams {
  from: { lat: number; lng: number }
  to: { lat: number; lng: number }
  token: string
  signal?: AbortSignal
}

/**
 * Interroge Mapbox Directions (profil driving-traffic) pour obtenir une durée
 * estimée tenant compte du trafic temps réel. Retourne null si l'API échoue
 * ou si aucune route n'est trouvée — l'appelant doit alors retomber sur OSRM.
 */
export async function fetchMapboxTrafficDuration(params: FetchParams): Promise<TrafficEstimate | null> {
  const { from, to, token, signal } = params
  if (!token) return null
  const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${coords}?access_token=${token}&overview=false`
  try {
    const res = await fetch(url, { signal })
    if (!res.ok) return null
    const json = await res.json()
    const route = json.routes?.[0]
    if (!route) return null
    return {
      durationSec: Math.round(route.duration),
      distanceM: Math.round(route.distance),
    }
  } catch {
    return null
  }
}
