'use client'
import { useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import type { DriverTab } from '@/components/taxilink/navTypes'

export type Tab = DriverTab
const VALID_TABS: Tab[] = ['home', 'courses', 'groupes', 'profil']

export function useDriverDashboard() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const activeTab: Tab = tabParam && (VALID_TABS as string[]).includes(tabParam) ? (tabParam as Tab) : 'home'

  const [showCreer, setShowCreer] = useState(false)
  const [detailMissionId, setDetailMissionId] = useState<string | null>(null)

  const setActiveTab = (tab: Tab) => {
    setDetailMissionId(null)
    const params = new URLSearchParams(searchParams.toString())
    if (tab === 'home') params.delete('tab')
    else params.set('tab', tab)
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  return {
    activeTab,
    setActiveTab,
    showCreer,
    setShowCreer,
    detailMissionId,
    setDetailMissionId,
  }
}
