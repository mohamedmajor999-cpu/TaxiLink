// Helpers de bucketisation jour/semaine/mois pour les missions.

export interface MissionRow {
  id:             string
  status:         string
  type:           string | null
  departement:    string | null
  medical_motif:  string | null
  view_count:     number | null
  created_at:     string
  accepted_at:    string | null
  completed_at:   string | null
  price_eur:      number | null
  price_min_eur:  number | null
  price_max_eur:  number | null
}

export interface DailyBucket {
  period:         string
  posted:         number
  accepted:       number
  completed:      number
  totalAmount:    number
  acceptanceRate: number
}

export function unitPrice(r: MissionRow): number {
  if (r.price_eur != null) return Number(r.price_eur)
  if (r.price_min_eur != null && r.price_max_eur != null) {
    return (Number(r.price_min_eur) + Number(r.price_max_eur)) / 2
  }
  return 0
}

export function dayKey(iso: string):   string { return iso.slice(0, 10) }
export function monthKey(iso: string): string { return iso.slice(0, 7) }
export function weekKey(iso: string):  string {
  const d = new Date(iso)
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const dayNum = (target.getUTCDay() + 6) % 7
  target.setUTCDate(target.getUTCDate() - dayNum + 3)
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4))
  const week = 1 + Math.round(
    ((target.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7
  )
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

export function bucketize(
  rows: MissionRow[],
  keyFn: (iso: string) => string,
  limit: number
): DailyBucket[] {
  const map = new Map<string, DailyBucket>()
  for (const r of rows) {
    const k = keyFn(r.created_at)
    const b = map.get(k) ?? { period: k, posted: 0, accepted: 0, completed: 0, totalAmount: 0, acceptanceRate: 0 }
    b.posted += 1
    if (r.accepted_at)  b.accepted += 1
    if (r.completed_at) b.completed += 1
    b.totalAmount += unitPrice(r)
    map.set(k, b)
  }
  const result = Array.from(map.values())
  for (const b of result) {
    b.acceptanceRate = b.posted > 0 ? Math.round((b.accepted / b.posted) * 100) : 0
  }
  return result.sort((a, b) => b.period.localeCompare(a.period)).slice(0, limit)
}
