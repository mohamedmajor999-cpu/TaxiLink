import { DriverDashboard } from '@/components/dashboard/driver/DriverDashboard'
import type { Metadata } from 'next'
import { Suspense } from 'react'

export const metadata: Metadata = { title: 'Dashboard Chauffeur' }

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-paper dark:bg-night-bg flex items-center justify-center">
      <div className="w-full max-w-md px-6 space-y-3">
        <div className="h-12 rounded-2xl bg-warm-100 dark:bg-night-elevated motion-safe:animate-pulse" />
        <div className="h-32 rounded-2xl bg-warm-100 dark:bg-night-elevated motion-safe:animate-pulse" />
        <div className="h-20 rounded-2xl bg-warm-100 dark:bg-night-elevated motion-safe:animate-pulse" />
      </div>
    </div>
  )
}

export default function DriverPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DriverDashboard />
    </Suspense>
  )
}
