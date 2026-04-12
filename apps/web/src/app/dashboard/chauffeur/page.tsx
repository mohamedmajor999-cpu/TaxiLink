import { DriverDashboard } from '@/components/dashboard/driver/DriverDashboard'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard Chauffeur' }

export default function DriverPage() {
  return <DriverDashboard />
}
