'use client'
import { FileText, Loader2 } from 'lucide-react'
import type { Mission } from '@/lib/supabase/types'

const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

interface Props {
  missions: Mission[]
  generating?: boolean
  onGenerateInvoice: (year: number, quarter: number) => void
}

export function HistoryQuarterCard({ missions, generating, onGenerateInvoice }: Props) {
  const now = new Date()
  const year = now.getFullYear()
  const quarter = Math.floor(now.getMonth() / 3) + 1
  const startMonth = (quarter - 1) * 3
  const endMonth = startMonth + 2
  const start = new Date(year, startMonth, 1)
  const end = new Date(year, endMonth + 1, 0, 23, 59, 59, 999)

  const inQuarter = missions.filter((m) => {
    const d = new Date(m.completed_at ?? m.scheduled_at)
    return d >= start && d <= end
  })
  const total = inQuarter.reduce((s, m) => s + Number(m.price_eur ?? 0), 0)
  const cpam = inQuarter.filter((m) => m.type === 'CPAM').reduce((s, m) => s + Number(m.price_eur ?? 0), 0)
  const prive = inQuarter.filter((m) => m.type === 'PRIVE').reduce((s, m) => s + Number(m.price_eur ?? 0), 0)

  return (
    <article className="rounded-2xl border border-warm-200 bg-paper p-4">
      <header className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-[13px] font-extrabold text-ink leading-tight">
            Trimestre Q{quarter} {year}
          </h3>
          <p className="text-[11px] text-warm-500 mt-0.5">
            {MONTHS_FR[startMonth]} → {MONTHS_FR[endMonth]} · {inQuarter.length} course{inQuarter.length > 1 ? 's' : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onGenerateInvoice(year, quarter)}
          disabled={generating || inQuarter.length === 0}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-brand text-ink text-[11.5px] font-extrabold hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {generating
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.4} />
            : <FileText className="w-3.5 h-3.5" strokeWidth={2.4} />}
          Facture PDF
        </button>
      </header>
      <div className="grid grid-cols-3 gap-2">
        <Cell k="CA total" v={Math.round(total)} unit="€" />
        <Cell k="CPAM" v={Math.round(cpam)} unit="€" />
        <Cell k="Privé" v={Math.round(prive)} unit="€" />
      </div>
    </article>
  )
}

function Cell({ k, v, unit }: { k: string; v: number; unit?: string }) {
  return (
    <div className="rounded-lg bg-warm-50 p-2">
      <div className="text-[9.5px] font-bold uppercase tracking-[0.06em] text-warm-500">{k}</div>
      <div className="text-[14px] font-extrabold text-ink mt-0.5 tabular-nums">
        {v.toLocaleString('fr-FR')}{unit && <span className="text-[11px] opacity-70 ml-0.5">{unit}</span>}
      </div>
    </div>
  )
}
