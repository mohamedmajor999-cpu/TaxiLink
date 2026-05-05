import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AcceptInvitationClient } from './AcceptInvitationClient'

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/auth/login?redirect=${encodeURIComponent(`/invite/${token}`)}`)
  }

  return <AcceptInvitationClient token={token} />
}
