/** Formate une durée en minutes en "X min", "Xh" ou "Xh YY". */
export function formatDuration(minutes: number): string {
  const m = Math.max(0, Math.round(minutes))
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const rem = m % 60
  if (rem === 0) return `${h} h`
  return `${h} h ${rem.toString().padStart(2, '0')}`
}
