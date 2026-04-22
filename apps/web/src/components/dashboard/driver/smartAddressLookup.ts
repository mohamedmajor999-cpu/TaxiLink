import {
  primeGoogleAutocompleteCache,
  resolveGooglePlace,
  searchGoogle,
  type AddressSuggestion,
} from '@/services/addressService'

const POI_REGEX = /h[oô]pital|clinique|gare|a[ée]roport|pharmacie|mairie|[ée]cole|lyc[ée]e|coll[èe]ge|universit[ée]|stade|piscine|m[ée]diath[èe]que|cabinet|laboratoire|ehpad|centre commercial|maison de retraite|cimeti[èe]re/i
const STREET_REGEX = /\b(rue|avenue|av|boulevard|bd|place|impasse|chemin|route|all[ée]e|cours|quai|square|esplanade|parvis)\b/i
const ARRONDISSEMENT_REGEX = /,?\s*\b\d{1,2}\s*(?:e|è|er|ère|ème|eme)?\s*arrondissement\b/i

function rewriteArrondissement(q: string): string {
  if (STREET_REGEX.test(q) || POI_REGEX.test(q)) return q
  const city = /\bparis\b/i.test(q) ? 'Paris' : /\bmarseille\b/i.test(q) ? 'Marseille' : /\blyon\b/i.test(q) ? 'Lyon' : null
  if (!city) return q
  const m = q.match(/\b(\d{1,2})(?:\s*(?:e|è|er|ère|ème|eme|arrondissement))?\b/i)
  const num = m ? parseInt(m[1]!, 10) : 0
  if (num < 1 || num > 20) return q
  return `Mairie du ${num}${num === 1 ? 'er' : 'e'} arrondissement ${city}`
}

// Google Places peine parfois sur « POI, Xe arrondissement, Ville » : on retente
// sans l'arrondissement si la première requête ne renvoie rien.
function buildFallbackQueries(q: string): string[] {
  const variants: string[] = []
  const withoutArr = q.replace(ARRONDISSEMENT_REGEX, '').replace(/\s*,\s*,/g, ',').replace(/\s+/g, ' ').trim()
  if (withoutArr && withoutArr !== q) variants.push(withoutArr)
  return variants
}

/**
 * Transforme un texte libre (issu de la voix) en une suggestion d'adresse.
 * Interroge Google Places (New) et renvoie le meilleur match, ou null.
 */
export async function smartAddressLookup(raw: string): Promise<AddressSuggestion | null> {
  const query = rewriteArrondissement(raw)
  const queries = [query, ...buildFallbackQueries(query)]
  let first: AddressSuggestion | undefined
  for (const q of queries) {
    const results = await searchGoogle(q).catch(() => [])
    first = results[0]
    if (first?.placeId) break
  }
  if (!first?.placeId) return null
  const details = await resolveGooglePlace(first.placeId).catch(() => null)
  if (!details) return null
  const enrichedLabel = details.formattedAddress && first.mainText
    ? `${first.mainText}, ${details.formattedAddress}`
    : details.formattedAddress ?? first.label
  const resolved: AddressSuggestion = {
    ...first,
    label: enrichedLabel,
    lat: details.lat,
    lng: details.lng,
  }
  // Pré-peuple le cache : quand useAddressField déclenchera une recherche sur
  // le label enrichi (value changeant après setDeparture), ce sera un cache HIT.
  primeGoogleAutocompleteCache(enrichedLabel, resolved)
  return resolved
}
