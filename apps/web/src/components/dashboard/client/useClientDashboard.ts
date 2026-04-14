import { useState } from 'react'

export type Tab = 'reserver' | 'mes-courses'

export function useClientDashboard() {
  const [tab, setTab] = useState<Tab>('reserver')
  return { tab, setTab }
}
