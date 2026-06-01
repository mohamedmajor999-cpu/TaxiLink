// Types et helpers partagés par les méthodes de groupStatsService.
// Réplique apps/web/src/services/groupStatsService.helpers.ts.

// TTL de présence : un chauffeur compte comme "en ligne" uniquement si son
// last_seen_at est < ONLINE_TTL_MS. Le client ping toutes les 60s
// (useDriverHeartbeat) ; on tolère donc un retard d'un cycle.
export const ONLINE_TTL_MS = 120_000

export function isFreshlyOnline(
  isOnline: boolean | undefined | null,
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
  /** IDs des chauffeurs actuellement en ligne dans ce groupe. Sert a dedupliquer
   * l'agregat global (pulse "X collegues en ligne sur tous tes groupes") quand
   * un meme chauffeur appartient a plusieurs groupes. Avant : onlineCount etait
   * somme naivement → user dans 3 groupes => compte = 3 alors qu'il est seul.
   * Bug rapporte 2026-05-24. */
  onlineDriverIds: string[]
  /** ISO date du dernier événement (post ou acceptation) sur les 7 derniers jours. */
  lastEventAt: string | null
}

export interface GroupDailyActivity {
  date: string
  count: number
}
