/**
 * Découpe une adresse française en deux lignes pour un affichage mobile compact :
 * la partie rue/lieu d'un côté, le code postal + ville de l'autre.
 * Exemple : "6 Avenue Henri Romain Boyer 13015 Marseille"
 *        → { street: "6 Avenue Henri Romain Boyer", cityLine: "13015 Marseille" }
 * Si aucun code postal n'est détecté, `cityLine` vaut `null` et `street` contient l'adresse brute.
 */
export function splitFrenchAddress(raw: string): { street: string; cityLine: string | null } {
  const trimmed = raw.trim()
  const match = /\b\d{5}\b/.exec(trimmed)
  if (!match) return { street: trimmed, cityLine: null }
  const street = trimmed.slice(0, match.index).trim().replace(/,\s*$/, '')
  const cityLine = trimmed.slice(match.index).trim()
  return { street: street || trimmed, cityLine: cityLine || null }
}

/** Forme « point » attendue par RouteTimeline : rue sur la ligne principale, CP+ville en sous-ligne. */
export function addressAsPoint(raw: string): { name: string; address?: string } {
  const { street, cityLine } = splitFrenchAddress(raw)
  return cityLine ? { name: street, address: cityLine } : { name: street }
}
