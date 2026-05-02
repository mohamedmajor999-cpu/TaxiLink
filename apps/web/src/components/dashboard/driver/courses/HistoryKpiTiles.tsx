'use client'

interface Props {
  total: number
  count: number
  avgPerRide: number
  cpamRatioPct: number
}

export function HistoryKpiTiles({ total, count, avgPerRide, cpamRatioPct }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3">
      <Tile k="Revenus" v={`${Math.round(total).toLocaleString('fr-FR')}`} unit="€" />
      <Tile k="Courses" v={`${count}`} />
      <Tile k="€ / course" v={`${avgPerRide.toFixed(1).replace('.', ',')}`} unit="€" />
      <Tile k="Ratio CPAM" v={`${cpamRatioPct}`} unit="%" />
    </div>
  )
}

function Tile({ k, v, unit }: { k: string; v: string; unit?: string }) {
  return (
    <div className="rounded-2xl border border-warm-200 bg-paper p-3 lg:p-4">
      <div className="text-[10.5px] lg:text-[11px] font-bold uppercase tracking-[0.06em] text-warm-500">{k}</div>
      <div className="mt-0.5 text-[18px] lg:text-[24px] font-extrabold text-ink leading-none tabular-nums">
        {v}
        {unit && <span className="text-[13px] lg:text-[16px] font-bold opacity-70 ml-0.5">{unit}</span>}
      </div>
    </div>
  )
}
