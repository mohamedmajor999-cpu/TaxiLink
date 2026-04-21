import type { Group } from '@taxilink/core'

const MIC_ERRORS: Record<string, string> = {
  'no-speech': 'Aucune voix détectée. Parlez plus fort ou rapprochez-vous du micro.',
  'audio-capture': 'Micro indisponible. Vérifiez qu\'il est branché et autorisé.',
  'not-allowed': 'Accès micro refusé. Autorisez-le dans les paramètres du navigateur.',
  'service-not-allowed': 'Accès micro refusé. Autorisez-le dans les paramètres du navigateur.',
  'network': 'Pas de réseau. La dictée Chrome nécessite Internet.',
  'aborted': 'Dictée interrompue.',
  'language-not-supported': 'Langue non supportée par votre navigateur.',
}

export function micErrorLabel(c: string | null): string | null {
  return c ? (MIC_ERRORS[c] ?? `Erreur micro (${c})`) : null
}

const DIACRITICS = /[\u0300-\u036f]/g

function normalizeGroupName(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(DIACRITICS, '').replace(/[^a-z0-9]+/g, '')
}

export function matchGroupIds(groups: Group[], names: string[]): string[] {
  const out: string[] = []
  for (const name of names) {
    const target = normalizeGroupName(name)
    if (!target) continue
    const exact = groups.find((g) => normalizeGroupName(g.name) === target)
    const match = exact ?? groups.find((g) => {
      const n = normalizeGroupName(g.name)
      return n.includes(target) || target.includes(n)
    })
    if (match && !out.includes(match.id)) out.push(match.id)
  }
  return out
}
