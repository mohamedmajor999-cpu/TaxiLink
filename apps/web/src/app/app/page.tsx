import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// Point d'entree de la PWA (start_url du manifest = /app). Redirige cote
// serveur immediatement -> zero flash de la landing marketing. La landing
// reste accessible via "/" pour les visiteurs en navigateur classique.
export const dynamic = 'force-dynamic'

export default async function PwaEntry() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  redirect(user ? '/dashboard/chauffeur' : '/auth/login')
}
