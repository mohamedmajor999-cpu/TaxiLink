import { NextResponse } from 'next/server'
import { assertAdmin } from '@/lib/adminAuth'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

// Suppression de compte par l'admin (Q5 = OUI, l'admin peut aussi supprimer).
// Meme strategie que /api/users/delete : anonymisation des donnees metier
// puis suppression auth.users. La fonction _anonymize_user_internal est
// reservee au service role.
export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await assertAdmin()
  if (!auth.ok) return auth.response

  const { id: targetUserId } = await context.params
  if (!targetUserId) {
    return NextResponse.json({ error: 'ID utilisateur manquant' }, { status: 400 })
  }
  // Garde-fou : l'admin ne peut pas se supprimer lui-meme par cette route
  // (eviterait de se locker dehors). Il devrait passer par /api/users/delete.
  if (targetUserId === auth.userId) {
    return NextResponse.json(
      { error: 'L\'admin ne peut pas se supprimer lui-même via cette route. Utilisez /api/users/delete.' },
      { status: 400 }
    )
  }

  const admin = createAdminSupabaseClient()

  const { error: anonErr } = await admin.rpc('_anonymize_user_internal', { p_user_id: targetUserId })
  if (anonErr) {
    return NextResponse.json(
      { error: `Anonymisation échouée : ${anonErr.message}` },
      { status: 500 }
    )
  }

  const { error: delErr } = await admin.auth.admin.deleteUser(targetUserId)
  if (delErr) {
    return NextResponse.json(
      { error: `Anonymisé mais suppression auth échouée : ${delErr.message}` },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true, anonymized: true, deleted: true, target: targetUserId })
}
