// Format court "il y a X" en français — pour les feeds d'activité où la
// précision exacte n'apporte rien (on veut savoir "récent ou pas").
export function timeAgoFr(iso: string, now: number = Date.now()): string {
  const t = new Date(iso).getTime()
  if (!Number.isFinite(t)) return ''
  const diff = Math.max(0, now - t)
  const min  = Math.round(diff / 60_000)
  if (min < 1)  return 'à l\'instant'
  if (min < 60) return `il y a ${min} min`
  const h = Math.round(min / 60)
  if (h < 24)   return `il y a ${h} h`
  const d = Math.round(h / 24)
  if (d < 7)    return `il y a ${d} j`
  const w = Math.round(d / 7)
  return `il y a ${w} sem`
}
