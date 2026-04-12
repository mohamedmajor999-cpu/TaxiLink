'use client'

import type { AgendaRide } from '@taxilink/core'
import { Icon } from '@/components/ui/Icon'
import { formatTime, formatEur, formatKm } from '@/lib/utils'

const TYPE_DOT_COLORS: Record<string, string> = {
  CPAM: 'bg-primary',
  PRIVE: 'bg-secondary',
  TAXILINK: 'bg-muted',
}

interface RideCardProps {
  ride: AgendaRide
  compact?: boolean
}

export function RideCard({ ride, compact = false }: RideCardProps) {
  const typeDotColor = TYPE_DOT_COLORS[ride.type] ?? 'bg-muted'

  return (
    <div className="course-card bg-white rounded-2xl shadow-soft border border-line p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${typeDotColor}`} />
          <div className="text-sm font-bold text-secondary truncate">{ride.patientName}</div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Icon name="schedule" size={13} className="text-muted" />
          <span className="text-xs font-bold text-secondary">{formatTime(ride.scheduledAt)}</span>
        </div>
      </div>

      <div className="flex items-start gap-3 mb-3">
        <div className="flex flex-col items-center gap-1 pt-1 flex-shrink-0">
          <div className="w-2 h-2 rounded-full bg-secondary" />
          <div className="w-0.5 h-4 bg-line" />
          <div className="w-2 h-2 rounded-full bg-primary border-2 border-secondary" />
        </div>
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <div className="text-xs text-muted font-semibold truncate">{ride.departure}</div>
          <div className="text-xs text-secondary font-semibold truncate">{ride.destination}</div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Icon name="route" size={13} className="text-muted" />
            <span className="text-xs font-semibold text-muted">{formatKm(ride.distanceKm)}</span>
          </div>
          <div className="text-sm font-black text-secondary">{formatEur(ride.priceEur)}</div>
        </div>
        {!compact && (
          <div className="flex items-center gap-2">
            <a
              href={`tel:${ride.phone}`}
              aria-label="Appeler"
              className="h-8 px-3 rounded-xl bg-primary text-secondary text-xs font-bold flex items-center gap-1 btn-ripple"
            >
              <Icon name="call" size={14} />Appeler
            </a>
            <a
              href={`sms:${ride.phone}`}
              aria-label="SMS"
              className="h-8 px-3 rounded-xl bg-bgsoft border border-line text-secondary text-xs font-bold flex items-center gap-1 btn-ripple"
            >
              <Icon name="sms" size={14} />SMS
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
