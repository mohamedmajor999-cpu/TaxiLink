// Types et helpers partages par les 4 methodes de groupStatsService.
// Extrait du fichier principal pour respecter le seuil 150 lignes/service
// (voir __tests__/fileSize.test.ts).

// TTL de presence : un chauffeur compte comme "en ligne" uniquement si son
// last_seen_at est < ONLINE_TTL_MS. Le client ping toutes les 60s
// (useDriverHeartbeat) ; on tolere donc un retard d'un cycle.
export const ONLINE_TTL_MS = 120_000

export function isFreshlyOnline(
  isOnline: boolean | undefined,
  lastSeenAt: string | null | undefined
): boolean {
  if (!isOnline) return false
  if (!lastSeenAt) return false
  return Date.now() - new Date(lastSeenAt).getTime() < ONLINE_TTL_MS
}

export interface GroupActivitySummary {
  available: number
  exchanged7d: number
  reprisePercent: number
  onlineCount: number
  /** ISO date du dernier événement (post ou acceptation) sur les 7 derniers
   *  jours. Null si aucun événement. Utilisé côté client pour décider
   *  d'afficher la pastille « nouveau » si > lastVisited. */
  lastEventAt: string | null
}

export interface GroupDailyActivity {
  date: string
  count: number
}
