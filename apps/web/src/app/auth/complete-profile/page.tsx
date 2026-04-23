import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { CompleteProfileForm } from '@/components/auth/CompleteProfileForm'

export const metadata: Metadata = {
  title: 'Compléter votre profil',
  description: 'Finalisez votre inscription TaxiLink Pro.',
  robots: { index: false, follow: false },
}

interface Props {
  searchParams: Promise<{ redirect?: string }>
}

export default async function CompleteProfilePage({ searchParams }: Props) {
  const params = await searchParams
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, phone')
    .eq('id', user.id)
    .single()

  const redirectTo = params.redirect ?? '/dashboard/chauffeur'

  const isComplete = !!(
    profile?.first_name?.trim() &&
    profile?.last_name?.trim() &&
    profile?.phone?.trim()
  )
  if (isComplete) redirect(redirectTo)

  return (
    <CompleteProfileForm
      userId={user.id}
      initialFirstName={profile?.first_name ?? ''}
      initialLastName={profile?.last_name ?? ''}
      initialPhone={profile?.phone ?? ''}
      redirectTo={redirectTo}
    />
  )
}
