import { DriverDashboard } from '@/components/dashboard/driver/DriverDashboard'
import type { Metadata } from 'next'
import { Suspense } from 'react'

export const metadata: Metadata = { title: 'Dashboard Chauffeur' }

export default function DriverPage() {
  return (
    <Suspense fallback={null}>
      <DriverDashboard />
    </Suspense>
  )
}
