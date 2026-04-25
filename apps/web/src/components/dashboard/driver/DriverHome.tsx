'use client'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { MissionAcceptedCelebration } from '@/components/ui/MissionAcceptedCelebration'
import { ToastContainer } from '@/components/ui/Toast'
import { useDriverHome } from './useDriverHome'
import { NextMissionBanner } from './NextMissionBanner'
import { DriverHomeSheet } from './home/DriverHomeSheet'
import { DriverHomeAcceptBar } from './home/DriverHomeAcceptBar'
import { DriverHomeTopOverlay } from './home/DriverHomeTopOverlay'
import { DriverHomeFilterChips } from './home/DriverHomeFilterChips'
import { MissionMapPopup } from './home/MissionMapPopup'
import { SHEET_FRACTION, type SheetSnap } from './home/useSheetDrag'

const DriverHomeMap = dynamic(
  () => import('./home/DriverHomeMap').then((m) => m.DriverHomeMap),
  { ssr: false, loading: () => <MapFallback /> },
)

interface Props {
  onPostCourse: () => void
  onShowMissionDetail: (id: string) => void
  onGoToProfile: () => void
  mapFullscreen: boolean
  onMapFullscreenChange: (v: boolean) => void
}

export function DriverHome({ onPostCourse, onShowMissionDetail, onGoToProfile, mapFullscreen, onMapFullscreenChange }: Props) {
  const h = useDriverHome()
  const [snap, setSnap] = useState<SheetSnap>('three')
  const [vh, setVh] = useState(0)
  useEffect(() => {
    const update = () => setVh(window.innerHeight)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  // Sheet = fraction de la hauteur d'ecran (vh) ; fallback 320px avant mount.
  const sheetHeightPx = vh > 0 ? Math.round(vh * SHEET_FRACTION[snap]) : 320

  const onAccept = async () => {
    try { await h.acceptSelected() } catch { /* toast déjà géré par acceptMission */ }
  }

  return (
    <div className={`flex flex-col md:flex-row md:h-screen overflow-hidden ${mapFullscreen ? 'h-[100dvh]' : 'h-[calc(100dvh-60px)]'}`} style={{ backgroundColor: '#FFFFFF' }}>
      {h.showConfetti && <MissionAcceptedCelebration onDone={h.clearConfetti} />}
      <ToastContainer toasts={h.toasts} onDismiss={h.dismissToast} />

      <div className="relative flex-1 min-h-[60px] md:flex-none md:w-[58%] md:h-full md:p-4" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="relative w-full h-full overflow-hidden md:rounded-2xl md:border md:border-warm-200 md:shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
          <DriverHomeMap
            missions={h.mappableMissions}
            userCoords={h.userCoords}
            userAccuracy={h.userAccuracy}
            selectedId={h.selectedMissionId}
            onSelect={h.toggleMission}
            fullscreen={mapFullscreen}
            onToggleFullscreen={() => onMapFullscreenChange(!mapFullscreen)}
          />
          <DriverHomeTopOverlay
            isOnline={h.driver.isOnline}
            count={h.scopeCount}
            initials={h.initials}
            onToggleOnline={() => h.setOnline(!h.driver.isOnline)}
            onProfile={onGoToProfile}
            onRequestLocation={h.hasUserCoords ? undefined : h.requestLocation}
            middle={mapFullscreen ? (
              <DriverHomeFilterChips
                filter={h.filter}
                counts={h.counts}
                urgentOnly={h.urgentOnly}
                nearbyOnly={h.nearbyOnly}
                hasUserCoords={h.hasUserCoords}
                onFilterChange={h.setFilter}
                onUrgentToggle={() => h.setUrgentOnly(!h.urgentOnly)}
                onNearbyToggle={() => h.setNearbyOnly(!h.nearbyOnly)}
                floating
              />
            ) : null}
          />
          {(snap === 'one' || mapFullscreen) && (
            <div className={`md:hidden absolute top-16 left-0 right-0 z-[500] pointer-events-auto ${mapFullscreen ? 'landscape:hidden' : ''}`}>
              <DriverHomeFilterChips
                filter={h.filter}
                counts={h.counts}
                urgentOnly={h.urgentOnly}
                nearbyOnly={h.nearbyOnly}
                hasUserCoords={h.hasUserCoords}
                onFilterChange={h.setFilter}
                onUrgentToggle={() => h.setUrgentOnly(!h.urgentOnly)}
                onNearbyToggle={() => h.setNearbyOnly(!h.nearbyOnly)}
                floating
              />
            </div>
          )}
          {h.selectedMission && mapFullscreen && (
            <div className="md:hidden">
              <MissionMapPopup
                mission={h.selectedMission}
                userCoords={h.userCoords}
                onAccept={onAccept}
                onShowDetail={() => h.selectedMissionId && onShowMissionDetail(h.selectedMissionId)}
                onClose={() => h.selectedMissionId && h.toggleMission(h.selectedMissionId)}
              />
            </div>
          )}
        </div>
      </div>

      <div className={`shrink-0 flex flex-col md:flex-none md:w-[42%] md:h-full md:border-l md:border-warm-200 ${mapFullscreen ? 'hidden md:flex' : ''}`}>
        <div
          className="relative shrink-0 -mt-6 md:mt-0 md:!h-auto md:flex-1 md:min-h-0 z-10 bg-paper rounded-t-[24px] md:rounded-none shadow-[0_-8px_30px_rgba(0,0,0,0.08)] md:shadow-none flex flex-col transition-[height] duration-300 ease-out"
          style={{ height: `${sheetHeightPx}px` }}
        >
          <DriverHomeSheet
            missions={h.filteredMissions}
            selectedId={h.selectedMissionId}
            userCoords={h.userCoords}
            filter={h.filter}
            counts={h.counts}
            urgentOnly={h.urgentOnly}
            nearbyOnly={h.nearbyOnly}
            hasUserCoords={h.hasUserCoords}
            onSelect={h.toggleMission}
            onFilterChange={h.setFilter}
            onUrgentToggle={() => h.setUrgentOnly(!h.urgentOnly)}
            onNearbyToggle={() => h.setNearbyOnly(!h.nearbyOnly)}
            onPostCourse={onPostCourse}
            scopeLabel={h.scopeLabel}
            loading={h.loading}
            snap={snap}
            onSnapChange={setSnap}
            banner={
              h.currentMission ? (
                <NextMissionBanner
                  mission={h.currentMission}
                  onShowDetail={() => onShowMissionDetail(h.currentMission!.id)}
                  onComplete={h.completeMission}
                  userCoords={h.userCoords}
                />
              ) : null
            }
          />
        </div>

        <div className={`${h.selectedMission ? 'block' : 'hidden'} md:block shrink-0 h-20 px-3 py-2.5 bg-paper border-t border-warm-200`}>
          <DriverHomeAcceptBar
            disabled={!h.selectedMission}
            onAccept={onAccept}
            onShowDetail={() => h.selectedMissionId && onShowMissionDetail(h.selectedMissionId)}
            emptyLabel="Sélectionnez une annonce"
          />
        </div>
      </div>
    </div>
  )
}

function MapFallback() {
  return (
    <div className="w-full h-full bg-paper flex items-center justify-center">
      <span className="text-[12px] font-semibold text-warm-500 motion-safe:animate-pulse">
        Chargement de la carte…
      </span>
    </div>
  )
}
