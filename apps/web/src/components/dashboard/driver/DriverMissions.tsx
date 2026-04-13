'use client'

import { Icon } from '@/components/ui/Icon'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import { ToastContainer } from '@/components/ui/Toast'
import { CurrentMissionBanner } from './CurrentMissionBanner'
import { MissionFilterBar } from './MissionFilterBar'
import { AvailableMissionGrid } from './AvailableMissionGrid'
import { useDriverMissions } from './useDriverMissions'

export function DriverMissions({ isOnline }: { isOnline: boolean }) {
  const {
    currentMission, loading, error,
    accepting, filter, setFilter, filtered,
    loadMissions, acceptMission, completeMission,
    toasts, dismissToast,
  } = useDriverMissions()

  if (!isOnline) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 rounded-full bg-bgsoft flex items-center justify-center mb-4 mx-auto">
          <Icon name="wifi_off" size={36} className="text-muted" />
        </div>
        <h3 className="text-xl font-bold text-secondary mb-2">Vous êtes hors ligne</h3>
        <p className="text-muted max-w-sm">
          Activez votre statut &quot;En ligne&quot; en haut de la page pour recevoir des missions.
        </p>
      </div>
    )
  }

  if (loading) return <SkeletonLoader count={3} height="h-40" />

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      {error && <ErrorBanner message={error} onRetry={loadMissions} />}
      {currentMission && (
        <CurrentMissionBanner mission={currentMission} onComplete={completeMission} />
      )}
      <MissionFilterBar filter={filter} count={filtered.length} onChange={setFilter} />
      <AvailableMissionGrid
        missions={filtered}
        accepting={accepting}
        currentMission={currentMission}
        onAccept={acceptMission}
      />
    </div>
  )
}
