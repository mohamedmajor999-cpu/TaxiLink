'use client'

interface Props {
  total: number
  count: number
  avgPerRide: number
  cpamRatioPct: number
}

export function HistoryKpiTiles({ total, count, avgPerRide, cpamRatioPct }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Tile k="Revenus" v={`${Math.round(total).toLocaleString('fr-FR')}`} unit="€" />
      <Tile k="Courses" v={`${count}`} />
      <Tile k="€ / course" v={`${avgPerRide.toFixed(1).replace('.', ',')}`} unit="€" />
      <Tile k="Ratio CPAM" v={`${cpamRatioPct}`} unit="%" />
    </div>
  )
}

function Tile({ k, v, unit }: { k: string; v: string; unit?: string }) {
  return (
    <div className="rounded-2xl border border-warm-200 bg-paper p-3">
      <div className="text-[10.5px] font-bold uppercase tracking-[0.06em] text-warm-500">{k}</div>
      <div className="mt-0.5 text-[18px] font-extrabold text-ink leading-none tabular-nums">
        {v}
        {unit && <span className="text-[13px] font-bold opacity-70 ml-0.5">{unit}</span>}
      </div>
    </div>
  )
}
