// Whitelist anti open-redirect : on n'accepte que les paths internes vers le
// dashboard. Une URL absolue ou un path inattendu retombe sur la home du role
// (laissee au middleware qui sait deja faire driver/client/admin).
const ALLOWED_PREFIX = '/dashboard/'

export function safeDashboardRedirect(
  raw: string | null | undefined,
  role: 'driver' | 'client' | string | null | undefined,
): string {
  const fallback = role === 'client' ? '/dashboard/client' : '/dashboard/chauffeur'
  if (!raw) return fallback
  // Doit etre un path relatif commencant par /dashboard/. Refuse //evil.com,
  // http(s)://, et tout chemin hors-dashboard.
  if (!raw.startsWith(ALLOWED_PREFIX)) return fallback
  if (raw.startsWith('//')) return fallback
  return raw
}

// Decode un message d'erreur place dans ?reason= par /auth/callback.
// Renvoie null si vide / non-string / pas decodable.
export function decodeAuthErrorReason(reason: string | null | undefined): string | null {
  if (!reason) return null
  try { return decodeURIComponent(reason) } catch { return reason }
}
