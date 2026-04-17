'use client'
import { useState } from 'react'
import type { DriverTab } from '@/components/taxilink/navTypes'

export type Tab = DriverTab

export function useDriverDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [showCreer, setShowCreer] = useState(false)

  return { activeTab, setActiveTab, showCreer, setShowCreer }
}
