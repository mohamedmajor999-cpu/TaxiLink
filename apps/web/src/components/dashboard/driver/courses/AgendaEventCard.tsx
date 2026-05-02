'use client'
import { MoreVertical, User, Utensils } from 'lucide-react'
import type { AgendaEvent } from './agendaHelpers'

interface Props {
  event: AgendaEvent
  onTap: () => void
  onMenu?: () => void
}

const fmt = (d: Date) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

export function AgendaEventCard({ event, onTap, onMenu }: Props) {
  const timeRange = `${fmt(event.start)} — ${fmt(event.end)}`
  const isBlock = event.isManual && event.from === event.to
  const showMenu = onMenu !== undefined

  if (isBlock) {
    return (
      <CardWrapper onTap={onTap} onMenu={onMenu} showMenu={showMenu} bg="bg-[#FEF3C7] border-[#FDE68A]">
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
      </CardWrapper>
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
    <CardWrapper onTap={onTap} onMenu={onMenu} showMenu={showMenu} bg="bg-paper border-warm-200">
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
    </CardWrapper>
  )
}

interface CardWrapperProps {
  children: React.ReactNode
  onTap: () => void
  onMenu?: () => void
  showMenu: boolean
  bg: string
}

function CardWrapper({ children, onTap, onMenu, showMenu, bg }: CardWrapperProps) {
  return (
    <div className={`relative w-full rounded-2xl border ${bg} transition-colors active:scale-[0.99]`}>
      <button
        type="button"
        onClick={onTap}
        className={`w-full text-left p-4 ${showMenu ? 'pr-12' : ''}`}
      >
        {children}
      </button>
      {showMenu && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onMenu?.()
          }}
          aria-label="Actions"
          className="absolute top-2 right-2 w-9 h-9 rounded-xl flex items-center justify-center text-warm-600 hover:bg-warm-100 transition-colors"
        >
          <MoreVertical className="w-4 h-4" strokeWidth={2} />
        </button>
      )}
    </div>
  )
}
