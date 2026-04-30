'use client'
import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Plus } from 'lucide-react'
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
import { useNightMode } from '@/hooks/useNightMode'

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
  const night = useNightMode()
  const [snap, setSnap] = useState<SheetSnap>('one')
  const [vh, setVh] = useState(0)
  const sheetRef = useRef<HTMLDivElement | null>(null)
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
  const onAcceptIncoming = async (id: string) => {
    try { await h.acceptMission(id); h.popup.dismiss(id) } catch { /* toast géré */ }
  }
  const sheetCollapsed = snap === 'one'

  // L'incoming est passe DIRECTEMENT au popup (pas via selectedMissionId qui
  // serait annule par le cleanup de useDriverHome si la mission ne passe pas
  // les filtres clients actifs).
  const incomingMission = h.popup.current
  const showDebug = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug')

  const chips = (
    <DriverHomeFilterChips
      filter={h.filter} counts={h.counts}
      urgentOnly={h.urgentOnly} nearbyOnly={h.nearbyOnly}
      hasUserCoords={h.hasUserCoords}
      onFilterChange={h.setFilter}
      onUrgentToggle={() => h.setUrgentOnly(!h.urgentOnly)}
      onNearbyToggle={() => h.setNearbyOnly(!h.nearbyOnly)}
      floating
    />
  )

  return (
    <div className="relative md:flex md:flex-row md:h-screen h-[100dvh] overflow-hidden bg-paper dark:bg-night-bg">
      {h.showConfetti && <MissionAcceptedCelebration onDone={h.clearConfetti} />}
      <ToastContainer toasts={h.toasts} onDismiss={h.dismissToast} />
      {showDebug && (
        <div className="fixed top-2 left-2 z-[9999] px-2 py-1.5 rounded-lg bg-black/85 text-white text-[10px] font-mono leading-tight max-w-[200px] pointer-events-none">
          <div>e:{h.popup.debug.events} q:{incomingMission ? '1+' : '0'} · {h.popup.debug.lastReason}</div>
          <div>on{h.popup.debug.isOnline ? '✓' : '✗'} pref{h.popup.debug.popupEnabled ? '✓' : '✗'} gps{h.popup.debug.hasCoords ? '✓' : '✗'}</div>
        </div>
      )}

      <div className="absolute inset-0 md:relative md:flex-none md:w-[58%] md:h-full md:p-4 md:inset-auto bg-paper dark:bg-night-bg">
        <div className="relative w-full h-full overflow-hidden md:rounded-2xl md:border md:border-warm-200 md:shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
          <DriverHomeMap
            missions={h.mappableMissions}
            userCoords={h.userCoords}
            userAccuracy={h.userAccuracy}
            selectedId={h.selectedMissionId}
            onSelect={h.toggleMission}
            fullscreen={mapFullscreen}
            onToggleFullscreen={() => onMapFullscreenChange(!mapFullscreen)}
            night={night.active}
          />
          <DriverHomeTopOverlay
            isOnline={h.driver.isOnline}
            count={h.scopeCount}
            initials={h.initials}
            onToggleOnline={() => { h.setOnline(!h.driver.isOnline).catch(() => { /* rollback gere dans le store */ }) }}
            onProfile={onGoToProfile}
            onRequestLocation={h.hasUserCoords ? undefined : h.requestLocation}
            nightActive={night.active}
            onToggleNight={night.toggle}
            middle={mapFullscreen ? chips : null}
          />
          {(sheetCollapsed || mapFullscreen) && (
            <div className={`md:hidden absolute top-16 left-0 right-0 z-[500] pointer-events-auto ${mapFullscreen ? 'landscape:hidden' : ''}`}>
              {chips}
            </div>
          )}
          {(incomingMission || (h.selectedMission && (mapFullscreen || sheetCollapsed))) && (
            <div className="md:hidden">
              <MissionMapPopup
                mission={(incomingMission ?? h.selectedMission)!}
                userCoords={h.userCoords}
                onAccept={incomingMission ? () => onAcceptIncoming(incomingMission.id) : onAccept}
                onShowDetail={() => onShowMissionDetail(incomingMission?.id ?? h.selectedMissionId!)}
                onClose={() => incomingMission ? h.popup.dismiss(incomingMission.id) : h.selectedMissionId && h.toggleMission(h.selectedMissionId)}
                autoDismissMs={incomingMission ? 10_000 : undefined}
                onAutoDismiss={incomingMission ? () => h.popup.dismiss(incomingMission.id) : undefined}
              />
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onPostCourse}
        aria-label="Poster une course"
        aria-hidden={!sheetCollapsed}
        tabIndex={sheetCollapsed ? 0 : -1}
        className={`md:hidden fixed left-1/2 -translate-x-1/2 z-[610] inline-flex items-center gap-2 h-12 px-5 rounded-full bg-ink text-paper text-[13px] font-bold shadow-[0_10px_28px_rgba(0,0,0,0.32)] active:scale-95 transition-all duration-300 whitespace-nowrap ${sheetCollapsed ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ bottom: `calc(${sheetHeightPx}px + 12px + env(safe-area-inset-bottom))` }}
      >
        <Plus className="w-5 h-5" strokeWidth={2.6} />
        Poster une course
      </button>

      <div className={`absolute bottom-0 left-0 right-0 md:relative md:inset-auto md:shrink-0 md:flex md:flex-col md:flex-none md:w-[42%] md:h-full md:border-l md:border-warm-200 z-[600] md:z-auto ${mapFullscreen ? 'hidden md:flex' : ''}`}>
        <div
          ref={sheetRef}
          className="relative shrink-0 md:mt-0 md:!h-auto md:flex-1 md:min-h-0 z-10 bg-transparent md:bg-paper md:dark:bg-night-bg flex flex-col transition-[height] duration-300 ease-out"
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
            sheetRef={sheetRef}
            vh={vh}
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

        <div className={`${h.selectedMission ? 'block' : 'hidden'} md:block shrink-0 h-20 px-3 py-2.5 bg-paper dark:bg-night-bg border-t border-warm-200 dark:border-night-border`}>
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
