import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { safeDashboardRedirect } from '@/lib/authRedirect'

// Server-only : si l'utilisateur est deja connecte, le pousse direct vers
// son dashboard (en respectant ?redirect=<path> + whitelist /dashboard/*).
// A appeler depuis les pages /auth/* (login, register, forgot-password) qui
// n'ont aucun sens pour un user authentifie. Sans ca, l'user pouvait voir
// le formulaire de login alors qu'il etait deja loggue → confusion + risque
// de re-login involontaire avec un autre compte.
export async function redirectIfAuthed(redirectParam?: string | null): Promise<void> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  const role = (profile as { role?: string } | null)?.role
  redirect(safeDashboardRedirect(redirectParam, role))
}
