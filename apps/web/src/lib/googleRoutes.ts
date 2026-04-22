// Google Routes API (computeRoutes) — durée et distance avec trafic prévu
// à l'heure de départ. `departureTime` doit être dans le futur ; sinon on
// retombe sur TRAFFIC_AWARE (temps réel) en laissant le champ vide.

const ENDPOINT = 'https://routes.googleapis.com/directions/v2:computeRoutes'

export interface TrafficEstimate {
  durationSec: number
  distanceM: number
  predicted: boolean
}

interface FetchParams {
  from: { lat: number; lng: number }
  to: { lat: number; lng: number }
  apiKey: string
  departureTime?: string | null
  signal?: AbortSignal
}

function isFutureIso(iso: string | null | undefined): iso is string {
  if (!iso) return false
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return false
  return t > Date.now() + 60_000
}

export async function fetchGoogleRoutesTraffic(params: FetchParams): Promise<TrafficEstimate | null> {
  const { from, to, apiKey, departureTime, signal } = params
  if (!apiKey) return null

  const predicted = isFutureIso(departureTime)
  const body: Record<string, unknown> = {
    origin: { location: { latLng: { latitude: from.lat, longitude: from.lng } } },
    destination: { location: { latLng: { latitude: to.lat, longitude: to.lng } } },
    travelMode: 'DRIVE',
    routingPreference: predicted ? 'TRAFFIC_AWARE_OPTIMAL' : 'TRAFFIC_AWARE',
    languageCode: 'fr',
    regionCode: 'fr',
  }
  if (predicted) body.departureTime = new Date(departureTime as string).toISOString()

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters',
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const txt = await res.text().catch(() => '')
      console.warn(`[googleRoutes] ${res.status} ${res.statusText}`, txt.slice(0, 300))
      return null
    }
    const json = await res.json() as { routes?: Array<{ duration?: string; distanceMeters?: number }> }
    const route = json.routes?.[0]
    if (!route?.duration || route.distanceMeters == null) return null
    const durationSec = parseInt(route.duration.replace(/s$/, ''), 10)
    if (!Number.isFinite(durationSec)) return null
    return { durationSec, distanceM: route.distanceMeters, predicted }
  } catch (err) {
    if ((err as Error)?.name !== 'AbortError') console.warn('[googleRoutes] fetch failed', err)
    return null
  }
}
