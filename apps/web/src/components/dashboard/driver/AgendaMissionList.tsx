'use client'

import { Icon } from '@/components/ui/Icon'
import { formatMissionPrice } from '@/lib/formatMissionPrice'
import type { Mission } from '@/lib/supabase/types'

const TYPE_COLORS: Record<string, string> = {
  CPAM:     'bg-yellow-100 text-yellow-800 border-yellow-200',
  PRIVE:    'bg-gray-100   text-gray-700   border-gray-200',
  TAXILINK: 'bg-blue-100   text-blue-700   border-blue-200',
}
const DOT: Record<string, string> = {
  CPAM: 'bg-primary', PRIVE: 'bg-secondary', TAXILINK: 'bg-muted',
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

type AgendaMissionListProps = {
  missions: Mission[]
  loading: boolean
}

export function AgendaMissionList({ missions, loading }: AgendaMissionListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-white rounded-2xl animate-pulse" />)}
      </div>
    )
  }
  if (missions.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl shadow-soft">
        <Icon name="event_busy" size={40} className="text-line mx-auto mb-3 block" />
        <p className="font-semibold text-secondary">Aucune course ce jour</p>
        <p className="text-sm text-muted mt-1">Sélectionnez un autre jour ou acceptez des missions</p>
      </div>
    )
  }
  return (
    <div className="space-y-3">
      {missions.map((m) => (
        <div key={m.id} className="bg-white rounded-2xl shadow-soft border border-line p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${DOT[m.type]}`} />
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${TYPE_COLORS[m.type]}`}>{m.type}</span>
            </div>
            <span className="text-sm font-bold text-secondary">{fmtTime(new Date(m.scheduled_at))}</span>
          </div>
          {m.patient_name && <p className="font-semibold text-secondary mb-2">{m.patient_name}</p>}
          <div className="flex items-start gap-3 mb-3">
            <div className="flex flex-col items-center gap-1 pt-1">
              <div className="w-2 h-2 rounded-full bg-secondary" />
              <div className="w-0.5 h-5 bg-line" />
              <div className="w-2 h-2 rounded-full bg-primary border-2 border-secondary" />
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted font-semibold">{m.departure}</p>
              <p className="text-xs text-secondary font-semibold">{m.destination}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm text-muted">
              <span>{m.distance_km} km</span>
              <span>·</span>
              <span className="font-black text-secondary">{formatMissionPrice(m, { decimals: true })}</span>
            </div>
            {m.phone && (
              <div className="flex gap-2">
                <a href={`tel:${m.phone}`} aria-label="Appeler"
                  className="h-8 px-3 rounded-xl bg-primary text-secondary text-xs font-bold flex items-center gap-1 hover:bg-yellow-400 transition-colors">
                  <Icon name="call" size={14} />Appeler
                </a>
                <a href={`sms:${m.phone}`} aria-label="SMS"
                  className="h-8 px-3 rounded-xl bg-bgsoft border border-line text-secondary text-xs font-bold flex items-center gap-1 hover:bg-gray-100 transition-colors">
                  <Icon name="sms" size={14} />SMS
                </a>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
