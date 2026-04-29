import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// Vérifie que l'utilisateur connecté est l'admin (email == ADMIN_EMAIL).
// Retourne soit l'utilisateur (succès), soit une NextResponse 401/403 à propager.
export async function assertAdmin(): Promise<
  | { ok: true;  userId: string; email: string }
  | { ok: false; response: NextResponse }
> {
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim()
  if (!adminEmail) {
    return { ok: false, response: NextResponse.json({ error: 'ADMIN_EMAIL non configuré' }, { status: 500 }) }
  }

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }) }
  }

  const userEmail = user.email?.toLowerCase().trim()
  if (userEmail !== adminEmail) {
    return { ok: false, response: NextResponse.json({ error: 'Accès interdit' }, { status: 403 }) }
  }

  return { ok: true, userId: user.id, email: user.email! }
}
