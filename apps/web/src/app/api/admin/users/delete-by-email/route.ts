import { NextResponse } from 'next/server'
import { assertAdmin } from '@/lib/adminAuth'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

// Endpoint admin : supprime un compte par email (RGPD art. 17 cote moderation).
// Resout l'email -> user_id puis appelle la meme chaine que /api/admin/users/[id]/delete.
export async function POST(request: Request) {
  const auth = await assertAdmin()
  if (!auth.ok) return auth.response

  let body: { email?: string }
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }
  const email = body.email?.trim().toLowerCase()
  if (!email) {
    return NextResponse.json({ error: 'Email requis' }, { status: 400 })
  }

  const admin = createAdminSupabaseClient()

  // Resolution email -> user_id via auth.admin (page 1 suffit pour la plupart
  // des comptes). Pour de gros volumes, prevoir un endpoint dedie ou un index.
  const { data: list, error: listErr } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  })
  if (listErr) {
    return NextResponse.json({ error: `Recherche email impossible : ${listErr.message}` }, { status: 500 })
  }
  const target = list.users.find((u) => (u.email ?? '').toLowerCase() === email)
  if (!target) {
    return NextResponse.json({ error: 'Aucun utilisateur trouvé avec cet email' }, { status: 404 })
  }

  if (target.id === auth.userId) {
    return NextResponse.json(
      { error: 'L\'admin ne peut pas se supprimer lui-même via cette route.' },
      { status: 400 }
    )
  }

  const { error: anonErr } = await admin.rpc('_anonymize_user_internal', { p_user_id: target.id })
  if (anonErr) {
    return NextResponse.json({ error: `Anonymisation échouée : ${anonErr.message}` }, { status: 500 })
  }
  const { error: delErr } = await admin.auth.admin.deleteUser(target.id)
  if (delErr) {
    return NextResponse.json({ error: `Anonymisé mais suppression auth échouée : ${delErr.message}` }, { status: 500 })
  }

  return NextResponse.json({ ok: true, deleted_email: email, deleted_user_id: target.id })
}
