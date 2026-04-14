import { useState } from 'react'

export type Tab = 'missions' | 'agenda' | 'groupes' | 'profil'

export function useDriverDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('missions')
  const [showCreer, setShowCreer] = useState(false)
  return { activeTab, setActiveTab, showCreer, setShowCreer }
}
