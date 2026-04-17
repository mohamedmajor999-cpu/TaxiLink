// Service d'autocomplétion d'adresses (API BAN — Base Adresse Nationale)
// et de calcul d'itinéraire (OSRM — Open Source Routing Machine).
// Aucune clé API requise. Limite de courtoisie ~50 req/s côté BAN.

const BAN_ENDPOINT = 'https://api-adresse.data.gouv.fr/search/'
const OSRM_ENDPOINT = 'https://router.project-osrm.org/route/v1/driving/'

export interface AddressSuggestion {
  label: string
  lat: number
  lng: number
  score: number
}

interface BanFeature {
  properties?: { label?: string; score?: number }
  geometry?: { coordinates?: [number, number] }
}

interface OsrmResponse {
  routes?: { distance?: number; duration?: number }[]
  code?: string
}

/**
 * Recherche d'adresses via l'API BAN. Retourne max 5 suggestions.
 * Si query < 3 caractères, retourne [] sans appel réseau.
 */
export async function searchAddresses(
  query: string,
  signal?: AbortSignal,
): Promise<AddressSuggestion[]> {
  const trimmed = query.trim()
  if (trimmed.length < 3) return []

  const url = `${BAN_ENDPOINT}?q=${encodeURIComponent(trimmed)}&limit=5&autocomplete=1`

  let res: Response
  try {
    res = await fetch(url, { signal })
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err
    throw new Error('Impossible de joindre le service d\'adresses')
  }

  if (!res.ok) {
    throw new Error(`Erreur BAN ${res.status}`)
  }

  const json = (await res.json()) as { features?: BanFeature[] }
  const features = json.features ?? []

  const suggestions: AddressSuggestion[] = []
  for (const f of features) {
    const label = f.properties?.label
    const coords = f.geometry?.coordinates
    if (!label || !coords || coords.length !== 2) continue
    const [lng, lat] = coords
    if (typeof lat !== 'number' || typeof lng !== 'number') continue
    suggestions.push({
      label,
      lat,
      lng,
      score: f.properties?.score ?? 0,
    })
  }
  return suggestions
}

/**
 * Calcule un itinéraire routier via OSRM.
 * Retourne distance en km (1 décimale) et durée en minutes (entier).
 * Lève "Itinéraire introuvable" si OSRM ne retourne aucune route.
 */
export async function computeRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  signal?: AbortSignal,
): Promise<{ distance_km: number; duration_min: number }> {
  const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`
  const url = `${OSRM_ENDPOINT}${coords}?overview=false`

  let res: Response
  try {
    res = await fetch(url, { signal })
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err
    throw new Error('Impossible de joindre le service de routage')
  }

  if (!res.ok) {
    throw new Error(`Erreur OSRM ${res.status}`)
  }

  const json = (await res.json()) as OsrmResponse
  const route = json.routes?.[0]
  if (!route || typeof route.distance !== 'number' || typeof route.duration !== 'number') {
    throw new Error('Itinéraire introuvable')
  }

  return {
    distance_km: Math.round(route.distance / 100) / 10,
    duration_min: Math.round(route.duration / 60),
  }
}
