import { ClientDashboard } from '@/components/dashboard/client/ClientDashboard'
import type { Metadata } from 'next'
import { Suspense } from 'react'
export const metadata: Metadata = { title: 'Mon espace' }
export default function ClientPage() {
  return (
    <Suspense fallback={null}>
      <ClientDashboard />
    </Suspense>
  )
}
