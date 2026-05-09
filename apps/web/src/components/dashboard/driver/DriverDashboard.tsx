'use client'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import { useDriverStore } from '@/store/driverStore'
import { useMissionStore } from '@/store/missionStore'
import { useMissionEditStore } from '@/store/missionEditStore'
import { usePostedMissionAcceptNotifier } from '@/hooks/usePostedMissionAcceptNotifier'
import { usePostedMissionUntakenNotifier } from '@/hooks/usePostedMissionUntakenNotifier'
import { useNightMode } from '@/hooks/useNightMode'
import { useDriverHeartbeat } from '@/hooks/useDriverHeartbeat'
import { useDriverPrimaryGroupName } from '@/hooks/useDriverPrimaryGroupName'
import { useGlobalDriverGps } from '@/hooks/useGlobalDriverGps'
import { useAutoMissionProgress } from '@/hooks/useAutoMissionProgress'
import { useUnseenAcceptCount } from '@/store/postedAcceptStore'
import { armNotificationAudio } from '@/lib/playNotificationSound'
import { SidebarNav } from '@/components/taxilink/SidebarNav'
import { MobileNavDrawer } from '@/components/taxilink/MobileNavDrawer'
import { MobileTopbar } from '@/components/taxilink/MobileTopbar'
import { MissionRealtimeProvider } from '@/components/realtime/MissionRealtimeProvider'
import { useDriverAuth } from './useDriverAuth'
import { useDriverDashboard } from './useDriverDashboard'
import { DriverHome } from './DriverHome'

// Lazy-load des ecrans non-default (-40-60% du bundle initial).
const TabFallback = () => <div className="px-4 md:px-8 pt-[calc(56px+env(safe-area-inset-top))] pb-4 md:pt-6 md:pb-6 max-w-6xl mx-auto"><div className="h-32 rounded-2xl bg-warm-100 motion-safe:animate-pulse" /></div>
const DriverCoursesScreen = dynamic(() => import('./DriverCoursesScreen').then((m) => m.DriverCoursesScreen), { loading: TabFallback })
const DriverGroupesScreen = dynamic(() => import('./DriverGroupesScreen').then((m) => m.DriverGroupesScreen), { loading: TabFallback })
const DriverProfilScreen = dynamic(() => import('./DriverProfilScreen').then((m) => m.DriverProfilScreen), { loading: TabFallback })
const DocumentsScreen = dynamic(() => import('./profil/DocumentsScreen').then((m) => m.DocumentsScreen), { loading: TabFallback })
const PersonalInfoScreen = dynamic(() => import('./profil/PersonalInfoScreen').then((m) => m.PersonalInfoScreen), { loading: TabFallback })
const DepartementsScreen = dynamic(() => import('./profil/DepartementsScreen').then((m) => m.DepartementsScreen), { loading: TabFallback })
const SupportScreen = dynamic(() => import('./profil/SupportScreen').then((m) => m.SupportScreen), { loading: TabFallback })
const BlockedDriversScreen = dynamic(() => import('./profil/BlockedDriversScreen').then((m) => m.BlockedDriversScreen), { loading: TabFallback })
const MissionDetailScreen = dynamic(() => import('./MissionDetailScreen').then((m) => m.MissionDetailScreen), { loading: TabFallback })
const PartagerMissionModal = dynamic(() => import('./PartagerMissionModal').then((m) => m.PartagerMissionModal))
const PostedMissionAcceptPopup = dynamic(() => import('./PostedMissionAcceptPopup').then((m) => m.PostedMissionAcceptPopup))
const PostedMissionUntakenPopup = dynamic(() => import('./PostedMissionUntakenPopup').then((m) => m.PostedMissionUntakenPopup))
const MissionEditSheet = dynamic(() => import('./courses/edit-sheet/MissionEditSheet').then((m) => m.MissionEditSheet))
const IncomingMissionOfferModal = dynamic(() => import('./IncomingMissionOfferModal').then((m) => m.IncomingMissionOfferModal))

export function DriverDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { driverName, loading } = useDriverAuth()
  const {
    activeTab,
    setActiveTab,
    showCreer,
    setShowCreer,
    detailMissionId,
    setDetailMissionId,
    profilSub,
    setProfilSub,
  } = useDriverDashboard()
  const { driver } = useDriverStore()
  const availableCount = useMissionStore((s) => s.missions.length)
  const editingMission = useMissionEditStore((s) => s.editing)
  const clearEdit = useMissionEditStore((s) => s.clearEdit)
  const primaryGroupName = useDriverPrimaryGroupName()
  usePostedMissionAcceptNotifier()
  usePostedMissionUntakenNotifier()
  useNightMode()
  useDriverHeartbeat()
  useGlobalDriverGps()
  useAutoMissionProgress()
  const unseenAcceptCount = useUnseenAcceptCount()
  const [mapFullscreen, setMapFullscreen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const isEditerUrl = searchParams.get('editer') === '1'
  // Sync URL → store : URL perd ?editer=1 (Precedent) → on vide le store pour fermer la modal.
  useEffect(() => {
    if (!isEditerUrl && editingMission) clearEdit()
  }, [isEditerUrl, editingMission, clearEdit])
  useEffect(() => armNotificationAudio(), [])
  const showModal = showCreer || Boolean(editingMission)
  const closeModal = () => {
    // Les deux modals ont une entree d'historique → router.back() suffit.
    if (editingMission || showCreer) router.back()
  }
  const handleTabChange = (tab: typeof activeTab) => {
    clearEdit()
    // Badge "annonces acceptees" visible → on amene directement sur Annonces
    // (sinon l'user atterrit sur Aujourd'hui sans voir d'ou vient le chiffre).
    if (tab === 'courses' && unseenAcceptCount > 0) {
      router.push('/dashboard/chauffeur?tab=courses&subtab=ads')
      return
    }
    setActiveTab(tab)
  }
  const handlePostCourse = () => router.push('/dashboard/chauffeur/publier-course')
  const goToPostedTab = () => {
    clearEdit()
    router.push('/dashboard/chauffeur?tab=courses&subtab=ads')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <span className="text-sm font-medium text-warm-500 motion-safe:animate-pulse">
          Chargement…
        </span>
      </div>
    )
  }

  const initials = driverName
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'YB'

  return (
    <MissionRealtimeProvider>
    <div className="min-h-screen flex bg-paper dark:bg-night-bg">
      <SidebarNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onPostCourse={handlePostCourse}
        driverName={driverName || 'Chauffeur'}
        driverInitials={initials}
        groupName={primaryGroupName}
        isOnline={driver.isOnline}
        badges={{ coursesNotif: unseenAcceptCount }}
      />

      <main className="flex-1 min-w-0 overflow-x-hidden">
        {showModal ? (
          <PartagerMissionModal onClose={closeModal} mission={editingMission ?? undefined} />
        ) : detailMissionId ? (
          <MissionDetailScreen missionId={detailMissionId} onBack={() => router.back()} />
        ) : (
          <>
            {activeTab === 'home' && <DriverHome onPostCourse={handlePostCourse} onShowMissionDetail={setDetailMissionId} onGoToProfile={() => handleTabChange('profil')} mapFullscreen={mapFullscreen} onMapFullscreenChange={setMapFullscreen} />}
            {activeTab === 'courses' && <DriverCoursesScreen onPostCourse={handlePostCourse} />}
            {activeTab === 'groupes' && (
              <div className="px-4 md:px-8 pt-[calc(66px+env(safe-area-inset-top))] pb-4 md:pt-6 md:pb-6 max-w-6xl mx-auto">
                <DriverGroupesScreen />
              </div>
            )}
            {activeTab === 'profil' && (
              <div className="px-4 md:px-8 pt-[calc(66px+env(safe-area-inset-top))] pb-4 md:pt-6 md:pb-6 max-w-6xl mx-auto">
                {profilSub === 'documents' ? (
                  <DocumentsScreen onBack={() => setProfilSub(null)} />
                ) : profilSub === 'infos' ? (
                  <PersonalInfoScreen onBack={() => setProfilSub(null)} />
                ) : profilSub === 'departements' ? (
                  <DepartementsScreen onBack={() => setProfilSub(null)} />
                ) : profilSub === 'support' ? (
                  <SupportScreen onBack={() => setProfilSub(null)} />
                ) : profilSub === 'blocked' ? (
                  <BlockedDriversScreen onBack={() => setProfilSub(null)} />
                ) : (
                  <DriverProfilScreen
                    driverName={driverName}
                    onOpenDocuments={() => setProfilSub('documents')}
                    onOpenInfos={() => setProfilSub('infos')}
                    onOpenDepartements={() => setProfilSub('departements')}
                    onOpenSupport={() => setProfilSub('support')}
                    onOpenBlocked={() => setProfilSub('blocked')}
                  />
                )}
              </div>
            )}
          </>
        )}
      </main>

      {!detailMissionId && (
        <MobileTopbar
          variant={activeTab === 'home' ? 'floating' : 'bar'}
          hasNotif={unseenAcceptCount > 0}
          onOpen={() => setDrawerOpen(true)}
        />
      )}

      <MobileNavDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onPostCourse={handlePostCourse}
        driverName={driverName || 'Chauffeur'}
        driverInitials={initials}
        groupName={primaryGroupName}
        isOnline={driver.isOnline}
        badges={{ courses: availableCount, coursesNotif: unseenAcceptCount }}
      />

      <PostedMissionAcceptPopup onViewPosted={goToPostedTab} />
      <PostedMissionUntakenPopup />
      <MissionEditSheet />
      <IncomingMissionOfferModal />
    </div>
    </MissionRealtimeProvider>
  )
}
