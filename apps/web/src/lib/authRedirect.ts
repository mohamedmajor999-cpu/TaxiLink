// Whitelist anti open-redirect : on n'accepte que les paths internes connus.
// Une URL absolue ou un path inattendu retombe sur la home du role
// (laissee au middleware qui sait deja faire driver/client/admin).
// /rejoindre/ et /invite/ sont les flows d'invitation : indispensables pour
// que l'user reprenne son acceptation apres bounce vers /auth/login.
const ALLOWED_PREFIXES = ['/dashboard/', '/rejoindre/', '/invite/'] as const

export function safeDashboardRedirect(
  raw: string | null | undefined,
  role: 'driver' | 'client' | string | null | undefined,
): string {
  const fallback = role === 'client' ? '/dashboard/client' : '/dashboard/chauffeur'
  if (!raw) return fallback
  // Refuse //evil.com (protocol-relative URL) et tout chemin hors-whitelist.
  if (raw.startsWith('//')) return fallback
  if (!ALLOWED_PREFIXES.some((p) => raw.startsWith(p))) return fallback
  return raw
}

// Decode un message d'erreur place dans ?reason= par /auth/callback.
// Renvoie null si vide / non-string / pas decodable.
export function decodeAuthErrorReason(reason: string | null | undefined): string | null {
  if (!reason) return null
  try { return decodeURIComponent(reason) } catch { return reason }
}
