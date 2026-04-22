// Formate la date/heure de rendez-vous d'une course et calcule le décompte
// restant avant prise en charge. Utilisé par CurrentCourseScreen.

const WEEKDAY_SHORT = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.']
const MONTH_SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

function pad2(n: number): string {
  return n.toString().padStart(2, '0')
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function formatScheduledDate(iso: string, now: Date = new Date()): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1)
  if (sameDay(d, now)) return "Aujourd'hui"
  if (sameDay(d, tomorrow)) return 'Demain'
  return `${WEEKDAY_SHORT[d.getDay()]} ${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`
}

export function formatScheduledTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

// Décompte humain jusqu'à scheduled_at. Négatif = rendez-vous passé.
export function formatCountdown(iso: string, now: Date = new Date()): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const diffMin = Math.round((d.getTime() - now.getTime()) / 60000)
  if (diffMin < -1) return `En retard de ${Math.abs(diffMin)} min`
  if (diffMin <= 1) return 'Maintenant'
  if (diffMin < 60) return `Dans ${diffMin} min`
  const h = Math.floor(diffMin / 60)
  const m = diffMin % 60
  if (h < 24) return m === 0 ? `Dans ${h} h` : `Dans ${h} h ${pad2(m)}`
  const days = Math.floor(h / 24)
  return days === 1 ? 'Demain' : `Dans ${days} jours`
}

// ETA = max(scheduled_at, now) + durée. Si le RDV est futur on part de l'heure
// prévue ; s'il est déjà passé ou imminent, on repart de maintenant.
export function computeEta(scheduledIso: string | null, durationSec: number | null, now: Date = new Date()): string {
  if (!durationSec) return '—'
  const scheduled = scheduledIso ? new Date(scheduledIso) : null
  const base = scheduled && !Number.isNaN(scheduled.getTime()) && scheduled.getTime() > now.getTime()
    ? scheduled
    : now
  const eta = new Date(base.getTime() + durationSec * 1000)
  return eta.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}
