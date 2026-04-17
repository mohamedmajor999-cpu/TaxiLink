'use client'
import { useDriverStore } from '@/store/driverStore'
import { SidebarNav } from '@/components/taxilink/SidebarNav'
import { MobileBottomNav } from '@/components/taxilink/MobileBottomNav'
import { useDriverAuth } from './useDriverAuth'
import { useDriverDashboard } from './useDriverDashboard'
import { DriverHome } from './DriverHome'
import { DriverCoursesScreen } from './DriverCoursesScreen'
import { DriverGroupesScreen } from './DriverGroupesScreen'
import { DriverProfilScreen } from './DriverProfilScreen'
import { PartagerMissionModal } from './PartagerMissionModal'

export function DriverDashboard() {
  const { driverName, loading, handleLogout } = useDriverAuth()
  const { activeTab, setActiveTab, showCreer, setShowCreer } = useDriverDashboard()
  const { driver } = useDriverStore()

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
    <div className="min-h-screen bg-paper flex">
      <SidebarNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onPostCourse={() => setShowCreer(true)}
        driverName={driverName || 'Chauffeur'}
        driverInitials={initials}
        groupName="Taxi13"
        isOnline={driver.isOnline}
      />

      <main className="flex-1 min-w-0">
        {activeTab === 'home' && <DriverHome onPostCourse={() => setShowCreer(true)} />}
        {activeTab === 'courses' && <DriverCoursesScreen onPostCourse={() => setShowCreer(true)} />}
        {activeTab === 'groupes' && (
          <div className="px-4 md:px-8 py-4 md:py-6 max-w-6xl mx-auto pb-24 md:pb-6">
            <DriverGroupesScreen />
          </div>
        )}
        {activeTab === 'profil' && (
          <div className="px-4 md:px-8 py-4 md:py-6 max-w-6xl mx-auto pb-24 md:pb-6">
            <DriverProfilScreen driverName={driverName} onLogout={handleLogout} />
          </div>
        )}
      </main>

      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onPostCourse={() => setShowCreer(true)}
      />

      {showCreer && <PartagerMissionModal onClose={() => setShowCreer(false)} />}
    </div>
  )
}
