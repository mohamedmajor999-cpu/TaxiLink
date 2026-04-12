import { ClientDashboard } from '@/components/dashboard/client/ClientDashboard'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Mon espace' }
export default function ClientPage() { return <ClientDashboard /> }
