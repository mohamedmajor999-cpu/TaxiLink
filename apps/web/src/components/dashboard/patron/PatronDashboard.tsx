'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PatronSidebar, PatronBottomNav } from '@/components/dashboard/patron/PatronSidebar'
import { PatronOverview } from '@/components/dashboard/patron/overview/PatronOverview'
import { PatronAgenda } from '@/components/dashboard/patron/agenda/PatronAgenda'
import { PatronMarketplace } from '@/components/dashboard/patron/marketplace/PatronMarketplace'
import { PatronDrivers } from '@/components/dashboard/patron/drivers/PatronDrivers'
import { PatronFinances } from '@/components/dashboard/patron/finances/PatronFinances'
import { OrgSettingsModal } from '@/components/dashboard/patron/OrgSettingsModal'

export type PatronTab = 'overview' | 'agenda' | 'marketplace' | 'drivers' | 'finances'

export function PatronDashboard() {
  const router = useRouter()
  const [tab, setTab] = useState<PatronTab>('overview')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const goToPost = () => router.push('/dashboard/patron/publier-course')

  return (
    <div className="min-h-screen flex bg-paper dark:bg-night-bg">
      <PatronSidebar activeTab={tab} onTabChange={setTab} onOpenSettings={() => setSettingsOpen(true)} onPostCourse={goToPost} />
      <main className="flex-1 min-w-0">
        <div className="px-4 md:px-8 py-4 md:py-8 max-w-[1400px] mx-auto pb-24 md:pb-8">
          {tab === 'overview'    && <PatronOverview onGoToMarketplace={() => setTab('marketplace')} />}
          {tab === 'agenda'      && <PatronAgenda />}
          {tab === 'marketplace' && <PatronMarketplace />}
          {tab === 'drivers'     && <PatronDrivers />}
          {tab === 'finances'    && <PatronFinances />}
        </div>
      </main>
      <PatronBottomNav activeTab={tab} onTabChange={setTab} />
      <OrgSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
