'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useDriverStore } from '@/store/driverStore'
import { useMissionStore } from '@/store/missionStore'
import { useMissionEditStore } from '@/store/missionEditStore'
import { usePostedMissionAcceptNotifier } from '@/hooks/usePostedMissionAcceptNotifier'
import { useNightMode } from '@/hooks/useNightMode'
import { useDriverHeartbeat } from '@/hooks/useDriverHeartbeat'
import { useDriverOfflineBeacon } from '@/hooks/useDriverOfflineBeacon'
import { useUnseenAcceptCount } from '@/store/postedAcceptStore'
import { Menu, Plus } from 'lucide-react'
import { SidebarNav } from '@/components/taxilink/SidebarNav'
import { MobileNavDrawer } from '@/components/taxilink/MobileNavDrawer'
import { useDriverAuth } from './useDriverAuth'
import { useDriverDashboard } from './useDriverDashboard'
import { DriverHome } from './DriverHome'
import { DriverCoursesScreen } from './DriverCoursesScreen'
import { DriverGroupesScreen } from './DriverGroupesScreen'
import { DriverProfilScreen } from './DriverProfilScreen'
import { DocumentsScreen } from './profil/DocumentsScreen'
import { PersonalInfoScreen } from './profil/PersonalInfoScreen'
import { DepartementsScreen } from './profil/DepartementsScreen'
import { BankAccountScreen } from './profil/BankAccountScreen'
import { InvoicesScreen } from './profil/InvoicesScreen'
import { SupportScreen } from './profil/SupportScreen'
import { MissionDetailScreen } from './MissionDetailScreen'
import { PartagerMissionModal } from './PartagerMissionModal'
import { PostedMissionAcceptPopup } from './PostedMissionAcceptPopup'

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
  useDriverOfflineBeacon()
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
              <div className="px-4 md:px-8 py-4 md:py-6 max-w-6xl mx-auto pb-24 md:pb-6">
                <DriverGroupesScreen />
              </div>
            )}
            {activeTab === 'profil' && (
              <div className="px-4 md:px-8 py-4 md:py-6 max-w-6xl mx-auto pb-24 md:pb-6">
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

      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        aria-label="Ouvrir le menu"
        className="md:hidden fixed top-3 left-3 z-[600] w-11 h-11 rounded-full bg-paper dark:bg-night-surface border border-warm-200 dark:border-night-border shadow-[0_4px_14px_rgba(0,0,0,0.12)] flex items-center justify-center text-ink dark:text-night-text active:scale-95 transition-transform"
        style={{ marginTop: 'env(safe-area-inset-top)' }}
      >
        <Menu className="w-5 h-5" strokeWidth={2} />
        {unseenAcceptCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-danger ring-2 ring-paper dark:ring-night-surface" aria-hidden="true" />
        )}
      </button>

      <button
        type="button"
        onClick={handlePostCourse}
        aria-label="Poster une course"
        className="md:hidden fixed bottom-[140px] right-4 z-[510] w-14 h-14 rounded-full bg-brand text-ink shadow-fab hover:shadow-fab-hover active:scale-95 transition-all flex items-center justify-center"
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      >
        <Plus className="w-7 h-7" strokeWidth={2.6} />
      </button>

      <MobileNavDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeTab={activeTab}
        onTabChange={handleTabChange}
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
