import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PatronDashboard } from '@/components/dashboard/patron/PatronDashboard'
import type { Metadata } from 'next'
import { Suspense } from 'react'

export const metadata: Metadata = { title: 'Dashboard Patron' }

export default async function PatronPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirect=/dashboard/patron')

  // Verification membership : on utilise la fonction SQL `current_org_ids()`
  // (SECURITY DEFINER, bypass RLS) plutot qu'un SELECT direct sur
  // organization_members qui peut etre filtre par les policies RLS.
  const { data: orgIds, error: orgErr } = await supabase.rpc('current_org_ids')
  if (orgErr || !orgIds || orgIds.length === 0) {
    redirect('/dashboard/chauffeur')
  }

  return (
    <Suspense fallback={null}>
      <PatronDashboard />
    </Suspense>
  )
}
