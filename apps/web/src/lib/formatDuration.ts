/** Durée en minutes : "X min", "Xh", "XhYY" (compact), "Xj", "Xj Yh". */
export function formatDuration(minutes: number): string {
  const m = Math.max(0, Math.round(minutes))
  if (m < 60) return `${m} min`
  if (m < 1440) {
    const h = Math.floor(m / 60)
    const rem = m % 60
    if (rem === 0) return `${h}h`
    return `${h}h${rem.toString().padStart(2, '0')}`
  }
  const d = Math.floor(m / 1440)
  const h = Math.floor((m % 1440) / 60)
  if (h === 0) return `${d}j`
  return `${d}j ${h}h`
}

/** Compte à rebours : "Dans Xj", "Dans Xh", "Dans X min", "Dans Xs". */
export function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  if (totalSec < 60) return `Dans ${totalSec}s`
  return `Dans ${formatDuration(Math.floor(totalSec / 60))}`
}
