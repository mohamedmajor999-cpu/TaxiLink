import type { Mission } from '@/lib/supabase/types'

// Cellule d'une grille type "GitHub contributions" : un jour, l'activite
// du chauffeur sur ce jour, et une intensite normalisee 0..4 pour le rendu.
export interface HeatmapCell {
  date: string        // YYYY-MM-DD (cle stable, locale-free)
  count: number       // nombre de courses ce jour
  total: number       // CA realise ce jour (euros)
  intensity: 0 | 1 | 2 | 3 | 4
}

const DAY_MS = 24 * 60 * 60 * 1000

function ymd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function quartile(count: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0 || max <= 0) return 0
  // Echelle quadratique pour qu'une journee a 1 course soit deja visible mais
  // que les pics ressortent. Bornes : <= 25% / <= 50% / <= 75% / au-dessus.
  const ratio = count / max
  if (ratio <= 0.25) return 1
  if (ratio <= 0.5) return 2
  if (ratio <= 0.75) return 3
  return 4
}

/**
 * Construit une grille de `days` jours se terminant aujourd'hui.
 * Les missions sont agregees par jour (date de cloture si dispo, sinon
 * date prevue). Les jours sans course sont presents avec count=0.
 */
export function buildHeatmap(missions: Mission[], days = 365, now: Date = new Date()): HeatmapCell[] {
  const buckets = new Map<string, { count: number; total: number }>()
  for (const m of missions) {
    const d = new Date(m.completed_at ?? m.scheduled_at)
    const key = ymd(d)
    const cur = buckets.get(key) ?? { count: 0, total: 0 }
    cur.count += 1
    cur.total += Number(m.price_eur ?? 0)
    buckets.set(key, cur)
  }

  const today = startOfDay(now)
  const cells: HeatmapCell[] = []
  let max = 0

  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(today.getTime() - i * DAY_MS)
    const key = ymd(d)
    const b = buckets.get(key) ?? { count: 0, total: 0 }
    if (b.count > max) max = b.count
    cells.push({ date: key, count: b.count, total: b.total, intensity: 0 })
  }

  for (const c of cells) c.intensity = quartile(c.count, max)
  return cells
}
