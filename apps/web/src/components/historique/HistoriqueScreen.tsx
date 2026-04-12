'use client'

import { Icon } from '@/components/ui/Icon'
import { formatEur, formatKm, formatTime } from '@/lib/utils'
import { MissionTypeBadge } from '@/components/ui/Badge'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { useHistoriqueScreen } from './useHistoriqueScreen'

export function HistoriqueScreen() {
  const { rides, loading, error, totalRides, totalEarnings, totalKm } = useHistoriqueScreen()

  return (
    <div className="px-5 pt-5 pb-28 hide-scrollbar">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight text-secondary mb-4">Historique</h1>

        {/* Recap */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white rounded-2xl shadow-soft p-3 flex flex-col gap-1.5">
            <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
              <Icon name="directions_car" size={15} className="text-secondary" />
            </div>
            <div className="text-2xl font-black text-secondary leading-none">{totalRides}</div>
            <div className="text-[10px] text-muted uppercase tracking-wider font-semibold">Courses</div>
          </div>
          <div className="bg-white rounded-2xl shadow-soft p-3 flex flex-col gap-1.5">
            <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
              <Icon name="route" size={15} className="text-accent" />
            </div>
            <div className="text-2xl font-black text-secondary leading-none">{totalKm.toFixed(0)}</div>
            <div className="text-[10px] text-muted uppercase tracking-wider font-semibold">km</div>
          </div>
          <div className="bg-secondary rounded-2xl shadow-soft p-3 flex flex-col gap-1.5">
            <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
              <Icon name="euro" size={15} className="text-primary" />
            </div>
            <div className="text-2xl font-black text-primary leading-none">{totalEarnings.toFixed(0)}€</div>
            <div className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Gains</div>
          </div>
        </div>
      </div>

      {loading && <SkeletonLoader count={4} height="h-32" />}
      {error && <ErrorBanner message={error} />}

      {/* List */}
      {!loading && !error && (
        <div className="space-y-3">
          {rides.map((ride) => (
            <div key={ride.id} className="bg-white rounded-2xl shadow-soft border border-line p-4">
              <div className="flex items-center justify-between mb-3">
                <MissionTypeBadge type={ride.type} />
                <div className="flex items-center gap-1">
                  <Icon name="schedule" size={13} className="text-muted" />
                  <span className="text-xs text-muted font-medium">
                    {formatTime(ride.scheduledAt)}
                  </span>
                  <span className="text-[10px] text-muted mx-1">·</span>
                  <span className="text-xs text-muted">
                    {new Date(ride.scheduledAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </div>

              <div className="text-sm font-bold text-secondary mb-2">{ride.patientName}</div>

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
                <div className="flex items-center gap-1">
                  <Icon name="route" size={13} className="text-muted" />
                  <span className="text-xs font-semibold text-muted">{formatKm(ride.distanceKm)}</span>
                </div>
                <div className="text-sm font-black text-secondary">{formatEur(ride.priceEur)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
