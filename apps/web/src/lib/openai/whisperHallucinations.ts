// Whisper hallucine en francais sur les audios silencieux ou tres bruyants
// (probleme connu OpenAI). Liste des phrases parasites les plus frequentes
// observees, normalisees lowercase sans diacritiques.
//
// Source: tickets GitHub openai/whisper, retours terrain TaxiLink, et corpus
// commun (Whisper a ete entraine sur des sous-titres YouTube).

const HALLUCINATION_PHRASES_NORMALIZED: readonly string[] = [
  'merci',
  'merci.',
  'merci !',
  'merci beaucoup',
  "merci d'avoir regarde",
  "merci d'avoir regarde cette video",
  "merci d'avoir ecoute",
  "merci a tous",
  'sous-titres realises par la communaute d\'amara.org',
  'sous-titres realises par',
  'sous-titres',
  'sous-titrage st\' 501',
  'sous-titrage',
  'a bientot',
  'au revoir',
  'au revoir.',
  'bonjour',
  'bonjour.',
  'bonjour a tous',
  'oui',
  'non',
  'voila',
  'd\'accord',
  '...',
  '. . .',
  'silence',
  'musique',
  '[musique]',
  '(musique)',
  'generique',
]

const DIACRITICS = /[̀-ͯ]/g

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Retourne true si le transcript est probablement une hallucination Whisper
// sur du silence/bruit. On accepte le transcript s'il contient au moins 4 mots
// de contenu OU > 30 chars apres normalisation, sauf s'il matche exactement
// une phrase parasite.
export function isLikelyHallucination(transcript: string): boolean {
  const normalized = normalize(transcript)
  if (normalized.length === 0) return true
  if (HALLUCINATION_PHRASES_NORMALIZED.includes(normalized)) return true
  // Tres court (< 12 chars) et compose uniquement de tokens parasites
  if (normalized.length < 12) {
    const tokens = normalized.split(/[\s.,!?]+/).filter(Boolean)
    if (tokens.length === 0) return true
    const allParasites = tokens.every((t) => HALLUCINATION_PHRASES_NORMALIZED.includes(t))
    if (allParasites) return true
  }
  return false
}
