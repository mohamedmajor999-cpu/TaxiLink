'use client'
import { useState } from 'react'
import type { DriverTab } from '@/components/taxilink/navTypes'

export type Tab = DriverTab

export function useDriverDashboard() {
  const [activeTab, setActiveTabRaw] = useState<Tab>('home')
  const [showCreer, setShowCreer] = useState(false)
  const [detailMissionId, setDetailMissionId] = useState<string | null>(null)

  const setActiveTab = (tab: Tab) => {
    setActiveTabRaw(tab)
    setDetailMissionId(null)
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
