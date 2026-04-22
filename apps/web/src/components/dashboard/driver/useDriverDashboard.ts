'use client'
import { useState } from 'react'
import type { DriverTab } from '@/components/taxilink/navTypes'

export type Tab = DriverTab

export function useDriverDashboard() {
  const [activeTab, setActiveTabRaw] = useState<Tab>('home')
  const [showCreer, setShowCreer] = useState(false)
  const [showCurrentCourse, setShowCurrentCourse] = useState(false)

  const setActiveTab = (tab: Tab) => {
    setActiveTabRaw(tab)
    setShowCurrentCourse(false)
  }

  return {
    activeTab,
    setActiveTab,
    showCreer,
    setShowCreer,
    showCurrentCourse,
    setShowCurrentCourse,
  }
}
