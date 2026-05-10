import { notFound } from 'next/navigation'
import { isAdminPage } from '@/lib/adminAuth'
import { TestMapLibreClient } from './TestMapLibreClient'

// Page debug MapLibre/OpenFreeMap. Reservee a l'admin (ADMIN_EMAIL).
export default async function Page() {
  if (!(await isAdminPage())) notFound()
  return <TestMapLibreClient />
}
