/**
 * Extraction du code département français à partir d'une adresse contenant
 * un code postal. Règles :
 *   - DOM (97xxx) → code à 3 chiffres : 971, 972, 973, 974, 975, 976, 977, 978
 *   - Corse : 20000-20199 → "2A" ; 20200-20999 → "2B"
 *   - Métropole : 2 premiers chiffres du code postal (01 à 95, sauf 20)
 * Retourne null si aucun code postal n'est trouvé ou s'il est hors France.
 */
import { ALL_DEPARTEMENTS, type DepartementInfo } from './departementsList'

export { ALL_DEPARTEMENTS }
export type { DepartementInfo }

const POSTAL_CODE_RE = /\b(\d{5})\b/
const DOM_DEPTS = new Set(['971', '972', '973', '974', '975', '976', '977', '978'])
const ALL_CODES = new Set(ALL_DEPARTEMENTS.map((d) => d.code))

export function extractDepartement(address: string | null | undefined): string | null {
  if (!address) return null
  const match = address.match(POSTAL_CODE_RE)
  if (!match) return null
  const code = match[1]

  if (code.startsWith('97')) {
    const dom = code.slice(0, 3)
    return DOM_DEPTS.has(dom) ? dom : null
  }

  if (code.startsWith('20')) {
    const num = parseInt(code, 10)
    return num < 20200 ? '2A' : '2B'
  }

  const dept = code.slice(0, 2)
  const num = parseInt(dept, 10)
  if (num >= 1 && num <= 95) return dept
  return null
}

export function isValidDepartement(code: string): boolean {
  return ALL_CODES.has(code)
}

export function departementName(code: string): string | null {
  return ALL_DEPARTEMENTS.find((d) => d.code === code)?.name ?? null
}
