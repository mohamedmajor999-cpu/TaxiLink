// Helpers de calcul/format pour patronAgendaService.

export function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function endOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

export function fromDayIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function shortenLabel(departure: string, destination: string): string {
  const dep = departure.split(',')[0].trim()
  const dst = destination.split(',')[0].trim()
  return `${dep} → ${dst}`
}

export function missionStatus(
  status: string,
  completedAt: string | null
): 'completed' | 'in-progress' | 'planned' {
  if (completedAt || status === 'DONE') return 'completed'
  if (status === 'IN_PROGRESS') return 'in-progress'
  return 'planned'
}
