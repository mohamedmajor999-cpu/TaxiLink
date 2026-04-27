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
import { SidebarNav } from '@/components/taxilink/SidebarNav'
import { MobileBottomNav } from '@/components/taxilink/MobileBottomNav'
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
        onPostCourse={() => setShowCreer(true)}
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
            {activeTab === 'home' && <DriverHome onPostCourse={() => setShowCreer(true)} onShowMissionDetail={setDetailMissionId} onGoToProfile={() => handleTabChange('profil')} mapFullscreen={mapFullscreen} onMapFullscreenChange={setMapFullscreen} />}
            {activeTab === 'courses' && <DriverCoursesScreen onPostCourse={() => setShowCreer(true)} />}
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

      {!mapFullscreen && (
        <MobileBottomNav
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onPostCourse={() => setShowCreer(true)}
          coursesBadge={availableCount}
          coursesNotif={unseenAcceptCount}
        />
      )}

      <PostedMissionAcceptPopup onViewPosted={goToPostedTab} />
    </div>
  )
}
