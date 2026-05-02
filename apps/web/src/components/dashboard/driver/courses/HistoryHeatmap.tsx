'use client'
import type { HeatmapCell } from '@/lib/historyHeatmap'

interface Props {
  cells: HeatmapCell[]
}

const INTENSITY_BG: Record<HeatmapCell['intensity'], string> = {
  0: '#F1EFE8',
  1: '#FFEC80',
  2: '#FFE04D',
  3: '#FFD629',
  4: '#FFD11A',
}

const MONTHS_FR = ['Janv.', 'Févr.', 'Mars', 'Avril', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.']

// Decoupe les cellules en colonnes-semaines, alignees sur le jour de la
// semaine (lundi = 0, dimanche = 6). Chaque colonne contient 7 cellules.
function toWeekColumns(cells: HeatmapCell[]): HeatmapCell[][] {
  if (cells.length === 0) return []
  const cols: HeatmapCell[][] = []
  let current: HeatmapCell[] = []

  for (const cell of cells) {
    const dow = new Date(cell.date).getDay() // 0=dim, 1=lun, ...
    const idx = (dow + 6) % 7 // lun=0, dim=6
    if (idx === 0 && current.length > 0) {
      cols.push(current)
      current = []
    }
    current.push(cell)
  }
  if (current.length > 0) cols.push(current)
  return cols
}

function formatTooltip(c: HeatmapCell): string {
  const d = new Date(c.date)
  const date = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  if (c.count === 0) return `${date} — aucune course`
  const ca = Math.round(c.total).toLocaleString('fr-FR')
  return `${date} — ${c.count} course${c.count > 1 ? 's' : ''} · ${ca}€`
}

function monthLabels(cells: HeatmapCell[]): { col: number; label: string }[] {
  const cols = toWeekColumns(cells)
  const seen = new Set<number>()
  const labels: { col: number; label: string }[] = []
  cols.forEach((week, i) => {
    const month = new Date(week[0].date).getMonth()
    if (!seen.has(month) && i > 0) {
      seen.add(month)
      labels.push({ col: i, label: MONTHS_FR[month] })
    }
  })
  return labels
}

export function HistoryHeatmap({ cells }: Props) {
  const cols = toWeekColumns(cells)
  const labels = monthLabels(cells)
  const totalDays = cells.filter((c) => c.count > 0).length
  const totalCourses = cells.reduce((s, c) => s + c.count, 0)

  return (
    <article className="rounded-2xl border border-warm-200 bg-paper p-4">
      <header className="flex items-end justify-between mb-3">
        <div>
          <h3 className="text-[13px] font-extrabold text-ink leading-tight">Activité 12 mois</h3>
          <p className="text-[11px] text-warm-500 mt-0.5">
            {totalCourses} courses · {totalDays} jours actifs
          </p>
        </div>
        <Legend />
      </header>

      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-1 min-w-max">
          <div className="relative h-3" aria-hidden="true">
            {labels.map(({ col, label }) => (
              <span
                key={`${col}-${label}`}
                className="absolute text-[9px] font-semibold uppercase tracking-wide text-warm-500"
                style={{ left: `${col * 14}px` }}
              >
                {label}
              </span>
            ))}
          </div>
          <div className="flex gap-[2px]" role="grid" aria-label="Carte d'activité par jour">
            {cols.map((week, i) => (
              <div key={i} className="flex flex-col gap-[2px]" role="row">
                {week.map((cell) => (
                  <span
                    key={cell.date}
                    role="gridcell"
                    title={formatTooltip(cell)}
                    aria-label={formatTooltip(cell)}
                    className="w-3 h-3 rounded-[3px]"
                    style={{ backgroundColor: INTENSITY_BG[cell.intensity] }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  )
}

function Legend() {
  return (
    <div className="flex items-center gap-1 text-[10px] text-warm-500">
      <span>Moins</span>
      {([0, 1, 2, 3, 4] as const).map((i) => (
        <span
          key={i}
          className="w-2.5 h-2.5 rounded-[2px]"
          style={{ backgroundColor: INTENSITY_BG[i] }}
          aria-hidden="true"
        />
      ))}
      <span>Plus</span>
    </div>
  )
}
