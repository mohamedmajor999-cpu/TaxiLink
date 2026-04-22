/** Durée en minutes, unité unique arrondie : "X min", "Xh", "Xj". */
export function formatDuration(minutes: number): string {
  const m = Math.max(0, Math.round(minutes))
  if (m < 60) return `${m} min`
  if (m < 1440) return `${Math.round(m / 60)}h`
  return `${Math.round(m / 1440)}j`
}

/** Compte à rebours : "Dans Xj", "Dans Xh", "Dans X min", "Dans Xs". */
export function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  if (totalSec < 60) return `Dans ${totalSec}s`
  return `Dans ${formatDuration(Math.floor(totalSec / 60))}`
}
