// Zone Unifiée de Prise en Charge (ZUPC) — Bouches-du-Rhône.
// Une course dont origine ET destination sont dans cette zone = tarif A/B
// (retour en charge probable). Autrement = tarif C/D (retour à vide).

const ZUPC_COMMUNES_BDR = [
  'aix en provence', 'arles', 'aubagne', 'istres', 'la ciotat',
  'marignane', 'marseille', 'martigues', 'miramas',
  'salon de provence', 'vitrolles',
] as const

function normalizeCommune(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[-']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Extrait la commune d'une adresse formatée style "Rue X, 13001 Marseille" ou
 * "Marseille Saint-Charles, 13001 Marseille". Retourne null si aucun segment
 * ne ressemble à une ville française. On prend le dernier segment non-vide
 * après virgule, on enlève un éventuel code postal, on normalise.
 */
export function extractCommune(address: string | null | undefined): string | null {
  if (!address) return null
  // Google stocke "…, 13015 Marseille, France" → on filtre le segment pays
  // pour qu'il ne devienne pas le "dernier segment".
  const segments = address.split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => !/^(france|fr)$/i.test(s))
  if (segments.length === 0) return null
  const last = segments[segments.length - 1]
  // Retire le code postal ("13015 Marseille" → "Marseille") puis un éventuel
  // "France" collé sans virgule ("Marseille France" → "Marseille").
  return last
    .replace(/^\d{4,5}\s+/, '')
    .replace(/\s+france$/i, '')
    .trim() || null
}

export function isInZupcBdr(commune: string | null | undefined): boolean {
  if (!commune) return false
  const n = normalizeCommune(commune)
  return ZUPC_COMMUNES_BDR.some((c) => n === c || n.includes(c))
}

export type ReturnMode = 'charge' | 'vide'

/**
 * Détermine si le retour est "en charge" (A/B) ou "à vide" (C/D) à partir des
 * adresses complètes. Retourne null si au moins une adresse est ambiguë —
 * l'appelant devra alors afficher une fourchette min/max.
 */
export function determineReturnMode(
  departure: string | null | undefined,
  destination: string | null | undefined,
): ReturnMode | null {
  const depCommune = extractCommune(departure)
  const dstCommune = extractCommune(destination)
  if (!depCommune || !dstCommune) return null
  const depIn = isInZupcBdr(depCommune)
  const dstIn = isInZupcBdr(dstCommune)
  return depIn && dstIn ? 'charge' : 'vide'
}
