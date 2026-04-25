'use client'
import { User, Utensils } from 'lucide-react'
import type { AgendaEvent } from './agendaHelpers'

interface Props {
  event: AgendaEvent
  onTap: () => void
}

const fmt = (d: Date) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

export function AgendaEventCard({ event, onTap }: Props) {
  const timeRange = `${fmt(event.start)} — ${fmt(event.end)}`
  const isBlock = event.isManual && event.from === event.to

  if (isBlock) {
    return (
      <button
        type="button"
        onClick={onTap}
        className="w-full text-left rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] p-4 transition-colors active:scale-[0.99]"
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[14px] font-bold text-ink tabular-nums">{timeRange}</span>
          <span className="text-[12px] font-extrabold uppercase tracking-[0.04em] text-[#B45309]">
            Indisponible
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[13px] text-warm-600 font-medium min-w-0">
          <Utensils className="w-3.5 h-3.5 shrink-0" strokeWidth={1.8} />
          <span className="truncate">{event.from}</span>
        </div>
      </button>
    )
  }

  const isCpam = event.type === 'CPAM'
  const typeLabel = isCpam ? 'CPAM' : event.type === 'TAXILINK' ? 'TaxiLink' : 'Privé'
  const typeColor = isCpam
    ? 'text-[#1E40AF]'
    : event.type === 'TAXILINK' ? 'text-emerald-700' : 'text-[#6B21A8]'
  const fromShort = event.from.split(',')[0]
  const toShort = event.to.split(',')[0]
  const route = `${fromShort} — ${toShort}`
  const meta = [
    event.returnTrip ? 'A/R' : null,
    event.priceEur > 0 ? `${event.priceEur.toFixed(2).replace('.', ',')} €` : null,
  ].filter(Boolean).join(' · ')

  return (
    <button
      type="button"
      onClick={onTap}
      className="w-full text-left rounded-2xl bg-paper border border-warm-200 p-4 transition-colors active:scale-[0.99]"
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[14px] font-bold text-ink tabular-nums">{timeRange}</span>
        <span className={`text-[11px] font-extrabold uppercase tracking-[0.04em] ${typeColor}`}>
          {typeLabel}
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-[13px] text-warm-600 font-medium min-w-0">
        <User className="w-3.5 h-3.5 shrink-0" strokeWidth={1.8} />
        <span className="truncate min-w-0">
          {event.patientName ? `${event.patientName} · ${route}` : route}
        </span>
      </div>
      {meta && <div className="text-[12px] text-warm-500 mt-1 tabular-nums">{meta}</div>}
    </button>
  )
}
