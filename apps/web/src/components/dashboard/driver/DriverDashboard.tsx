'use client'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import { useDriverStore } from '@/store/driverStore'
import { useMissionStore } from '@/store/missionStore'
import { useMissionEditStore } from '@/store/missionEditStore'
import { usePostedMissionAcceptNotifier } from '@/hooks/usePostedMissionAcceptNotifier'
import { useNightMode } from '@/hooks/useNightMode'
import { useDriverHeartbeat } from '@/hooks/useDriverHeartbeat'
import { useUnseenAcceptCount } from '@/store/postedAcceptStore'
import { SidebarNav } from '@/components/taxilink/SidebarNav'
import { MobileNavDrawer } from '@/components/taxilink/MobileNavDrawer'
import { MobileTopbar } from '@/components/taxilink/MobileTopbar'
import { useDriverAuth } from './useDriverAuth'
import { useDriverDashboard } from './useDriverDashboard'
import { DriverHome } from './DriverHome'

// Lazy-load des ecrans non-default : seul DriverHome (tab par defaut) est eager.
// Reduit le bundle JS initial du dashboard d'environ 40-60%.
const TabFallback = () => (
  <div className="px-4 md:px-8 pt-[calc(56px+env(safe-area-inset-top))] pb-4 md:pt-6 md:pb-6 max-w-6xl mx-auto">
    <div className="h-32 rounded-2xl bg-warm-100 motion-safe:animate-pulse" />
  </div>
)
const DriverCoursesScreen = dynamic(() => import('./DriverCoursesScreen').then((m) => m.DriverCoursesScreen), { loading: TabFallback })
const DriverGroupesScreen = dynamic(() => import('./DriverGroupesScreen').then((m) => m.DriverGroupesScreen), { loading: TabFallback })
const DriverProfilScreen = dynamic(() => import('./DriverProfilScreen').then((m) => m.DriverProfilScreen), { loading: TabFallback })
const DocumentsScreen = dynamic(() => import('./profil/DocumentsScreen').then((m) => m.DocumentsScreen), { loading: TabFallback })
const PersonalInfoScreen = dynamic(() => import('./profil/PersonalInfoScreen').then((m) => m.PersonalInfoScreen), { loading: TabFallback })
const DepartementsScreen = dynamic(() => import('./profil/DepartementsScreen').then((m) => m.DepartementsScreen), { loading: TabFallback })
const BankAccountScreen = dynamic(() => import('./profil/BankAccountScreen').then((m) => m.BankAccountScreen), { loading: TabFallback })
const InvoicesScreen = dynamic(() => import('./profil/InvoicesScreen').then((m) => m.InvoicesScreen), { loading: TabFallback })
const SupportScreen = dynamic(() => import('./profil/SupportScreen').then((m) => m.SupportScreen), { loading: TabFallback })
const MissionDetailScreen = dynamic(() => import('./MissionDetailScreen').then((m) => m.MissionDetailScreen), { loading: TabFallback })
const PartagerMissionModal = dynamic(() => import('./PartagerMissionModal').then((m) => m.PartagerMissionModal))
const PostedMissionAcceptPopup = dynamic(() => import('./PostedMissionAcceptPopup').then((m) => m.PostedMissionAcceptPopup))

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
  usePostedMissionAcceptNotifier()
  useNightMode()
  useDriverHeartbeat()
  const unseenAcceptCount = useUnseenAcceptCount()
  const [mapFullscreen, setMapFullscreen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const isEditerUrl = searchParams.get('editer') === '1'
  // Sync URL → store : si l'URL perd ?editer=1 (Precedent) alors que le store a
  // encore une mission en edition, on vide le store pour fermer la modal.
  useEffect(() => {
    if (!isEditerUrl && editingMission) clearEdit()
  }, [isEditerUrl, editingMission, clearEdit])
  const showModal = showCreer || Boolean(editingMission)
  const closeModal = () => {
    // Les deux modals (creer et editer) ont une entree d'historique → router.back()
    // defait proprement. Le useEffect ci-dessus clear le store quand l'URL perd editer.
    if (editingMission || showCreer) router.back()
  }
  const handleTabChange = (tab: typeof activeTab) => {
    // setActiveTab fait un seul push qui clear tab + mission + creer.
    // Le store d'edition n'est pas dans l'URL → on le reset ici.
    clearEdit()
    setActiveTab(tab)
  }
  // TEMPORAIRE : pendant la validation du redesign v4, le bouton "+" pointe sur
  // /dashboard/poster-mockup. Pour rebrancher l'ancien modal, remplacer
  // `handlePostCourse` par `() => setShowCreer(true)` dans les 4 callsites ci-dessous.
  const handlePostCourse = () => router.push('/dashboard/poster-mockup')
  const goToPostedTab = () => {
    clearEdit()
    router.push('/dashboard/chauffeur?tab=courses&subtab=posted')
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
    <div className="min-h-screen flex bg-paper dark:bg-night-bg">
      <SidebarNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onPostCourse={handlePostCourse}
        driverName={driverName || 'Chauffeur'}
        driverInitials={initials}
        groupName="Taxi13"
        isOnline={driver.isOnline}
        badges={{ coursesNotif: unseenAcceptCount }}
      />

      <main className="flex-1 min-w-0">
        {showModal ? (
          <PartagerMissionModal onClose={closeModal} mission={editingMission ?? undefined} />
        ) : detailMissionId ? (
          <MissionDetailScreen missionId={detailMissionId} onBack={() => router.back()} />
        ) : (
          <>
            {activeTab === 'home' && <DriverHome onPostCourse={handlePostCourse} onShowMissionDetail={setDetailMissionId} onGoToProfile={() => handleTabChange('profil')} mapFullscreen={mapFullscreen} onMapFullscreenChange={setMapFullscreen} />}
            {activeTab === 'courses' && <DriverCoursesScreen onPostCourse={handlePostCourse} />}
            {activeTab === 'groupes' && (
              <div className="px-4 md:px-8 pt-[calc(56px+env(safe-area-inset-top))] pb-4 md:pt-6 md:pb-6 max-w-6xl mx-auto">
                <DriverGroupesScreen />
              </div>
            )}
            {activeTab === 'profil' && (
              <div className="px-4 md:px-8 pt-[calc(56px+env(safe-area-inset-top))] pb-4 md:pt-6 md:pb-6 max-w-6xl mx-auto">
                {profilSub === 'documents' ? (
                  <DocumentsScreen onBack={() => setProfilSub(null)} />
                ) : profilSub === 'infos' ? (
                  <PersonalInfoScreen onBack={() => setProfilSub(null)} />
                ) : profilSub === 'departements' ? (
                  <DepartementsScreen onBack={() => setProfilSub(null)} />
                ) : profilSub === 'bank' ? (
                  <BankAccountScreen onBack={() => setProfilSub(null)} />
                ) : profilSub === 'invoices' ? (
                  <InvoicesScreen onBack={() => setProfilSub(null)} />
                ) : profilSub === 'support' ? (
                  <SupportScreen onBack={() => setProfilSub(null)} />
                ) : (
                  <DriverProfilScreen
                    driverName={driverName}
                    onOpenDocuments={() => setProfilSub('documents')}
                    onOpenInfos={() => setProfilSub('infos')}
                    onOpenDepartements={() => setProfilSub('departements')}
                    onOpenBank={() => setProfilSub('bank')}
                    onOpenInvoices={() => setProfilSub('invoices')}
                    onOpenSupport={() => setProfilSub('support')}
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
        groupName="Taxi13"
        isOnline={driver.isOnline}
        badges={{ courses: availableCount, coursesNotif: unseenAcceptCount }}
      />

      <PostedMissionAcceptPopup onViewPosted={goToPostedTab} />
    </div>
  )
}
