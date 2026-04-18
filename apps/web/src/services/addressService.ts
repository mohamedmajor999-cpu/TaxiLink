// Adresses : BAN (rues FR) + Photon (POI/OSM). Itinéraire : OSRM. Sans clé API.

const BAN_ENDPOINT = 'https://api-adresse.data.gouv.fr/search/'
const PHOTON_ENDPOINT = 'https://photon.komoot.io/api/'
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

/** Recherche adresses via BAN. Max 5 résultats. < 3 chars → []. */
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

interface PhotonFeature {
  properties?: {
    name?: string
    street?: string
    housenumber?: string
    city?: string
    postcode?: string
    osm_key?: string
  }
  geometry?: { coordinates?: [number, number] }
}

function formatPhotonLabel(p: PhotonFeature['properties']): string {
  if (!p) return ''
  const isPOI = !!p.name && p.osm_key !== 'place' && p.osm_key !== 'highway'
  if (isPOI) return [p.name, p.city].filter(Boolean).join(', ')
  const street = [p.housenumber, p.street].filter(Boolean).join(' ')
  return [street, p.postcode, p.city].filter(Boolean).join(' ').trim()
}

/** Recherche POI/lieux via Photon (OSM). poiOnly exclut routes/lieux génériques. */
export async function searchPlaces(
  query: string,
  signal?: AbortSignal,
  poiOnly = false,
): Promise<AddressSuggestion[]> {
  const trimmed = query.trim()
  if (trimmed.length < 3) return []
  const filter = poiOnly ? '&osm_tag=!highway&osm_tag=!place' : ''
  const url = `${PHOTON_ENDPOINT}?q=${encodeURIComponent(trimmed)}&limit=5&lang=fr${filter}`
  let res: Response
  try {
    res = await fetch(url, { signal })
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err
    throw new Error('Impossible de joindre le service de lieux')
  }
  if (!res.ok) throw new Error(`Erreur Photon ${res.status}`)
  const json = (await res.json()) as { features?: PhotonFeature[] }
  const suggestions: AddressSuggestion[] = []
  for (const f of json.features ?? []) {
    const label = formatPhotonLabel(f.properties)
    const coords = f.geometry?.coordinates
    if (!label || !coords || coords.length !== 2) continue
    const [lng, lat] = coords
    if (typeof lat !== 'number' || typeof lng !== 'number') continue
    suggestions.push({ label, lat, lng, score: 0 })
  }
  return suggestions
}

/** Itinéraire OSRM. Renvoie km (1 déc.) et min (entier). Lève si introuvable. */
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
