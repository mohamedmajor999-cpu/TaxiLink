// Zones Unifiées de Prise en Charge (ZUPC) des Bouches-du-Rhône.
//
// Logique officielle (arrêté préfectoral BDR 2026, article 3) :
// - Tarif A/B = retour EN CHARGE à la station (même ZUPC → le chauffeur peut
//   re-prendre un client au retour).
// - Tarif C/D = retour À VIDE à la station (sort de la ZUPC → rentre vide).
//
// Chaque commune principale du département est sa propre ZUPC (sauf Marseille
// qui englobe 4 communes limitrophes). Un trajet inter-ZUPC = retour à vide.

const ZUPC_MARSEILLE = [
  'marseille', 'allauch', 'plan de cuques', 'septemes les vallons',
]
const ZUPC_AIX = ['aix en provence']
const ZUPC_AUBAGNE = ['aubagne']
const ZUPC_AEROPORT = ['marignane', 'vitrolles']
const ZUPC_ARLES = ['arles']
const ZUPC_LA_CIOTAT = ['la ciotat']
const ZUPC_MARTIGUES = ['martigues']
const ZUPC_ISTRES = ['istres']
const ZUPC_MIRAMAS = ['miramas']
const ZUPC_SALON = ['salon de provence']

const ALL_ZUPC: readonly (readonly string[])[] = [
  ZUPC_MARSEILLE, ZUPC_AIX, ZUPC_AUBAGNE, ZUPC_AEROPORT,
  ZUPC_ARLES, ZUPC_LA_CIOTAT, ZUPC_MARTIGUES, ZUPC_ISTRES,
  ZUPC_MIRAMAS, ZUPC_SALON,
]

function normalizeCommune(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[-']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function extractCommune(address: string | null | undefined): string | null {
  if (!address) return null
  // Filtre le segment pays final (Google stocke "..., 13015 Marseille, France").
  const segments = address.split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => !/^(france|fr)$/i.test(s))
  if (segments.length === 0) return null
  const last = segments[segments.length - 1]
  return last
    .replace(/^\d{4,5}\s+/, '')
    .replace(/\s+france$/i, '')
    .trim() || null
}

/** Retourne la ZUPC (liste de communes normalisées) contenant la commune, ou null. */
function findZupc(commune: string | null | undefined): readonly string[] | null {
  if (!commune) return null
  const n = normalizeCommune(commune)
  for (const zupc of ALL_ZUPC) {
    if (zupc.some((c) => n === c || n.includes(c))) return zupc
  }
  return null
}

/** True si la commune est dans une ZUPC BDR connue (pour info / UI). */
export function isInZupcBdr(commune: string | null | undefined): boolean {
  return findZupc(commune) !== null
}

export type ReturnMode = 'charge' | 'vide'

/**
 * Détermine le mode de retour à partir des adresses :
 * - Même ZUPC → "charge" (tarif A/B)
 * - ZUPC différentes, ou au moins une hors BDR → "vide" (tarif C/D)
 * - Au moins une adresse inextractible → null (appelant affiche fourchette)
 */
export function determineReturnMode(
  departure: string | null | undefined,
  destination: string | null | undefined,
): ReturnMode | null {
  const depCommune = extractCommune(departure)
  const dstCommune = extractCommune(destination)
  if (!depCommune || !dstCommune) return null
  const depZupc = findZupc(depCommune)
  const dstZupc = findZupc(dstCommune)
  // Même ZUPC (même référence de tableau) = retour en charge
  if (depZupc && dstZupc && depZupc === dstZupc) return 'charge'
  return 'vide'
}
