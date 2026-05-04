import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

// RGPD art. 20 (droit a la portabilite) : le user telecharge l'integralite
// de ses donnees personnelles dans un format JSON structure et lisible.
//
// On utilise le service role pour collecter les donnees liees au user a
// travers les tables (RLS pourrait bloquer certaines lignes meme legitimes,
// ex. organization_members d'une org dont l'user n'est plus membre actif).
// L'autorisation est faite en amont : on ne renvoie que les donnees de
// auth.uid() recupere par le client authentifie.
export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }
  const userId = user.id

  const admin = createAdminSupabaseClient()

  const [
    profileRes,
    driverRes,
    missionsSharedRes,
    missionsDoneRes,
    missionsClientRes,
    documentsRes,
    groupMembersRes,
    orgMembersRes,
  ] = await Promise.all([
    admin.from('profiles').select('*').eq('id', userId).maybeSingle(),
    admin.from('drivers').select('*').eq('id', userId).maybeSingle(),
    admin.from('missions').select('*').eq('shared_by', userId),
    admin.from('missions').select('*').eq('driver_id', userId),
    admin.from('missions').select('*').eq('client_id', userId),
    admin.from('documents').select('*').eq('driver_id', userId),
    admin.from('group_members').select('*').eq('driver_id', userId),
    admin.from('organization_members').select('*').eq('user_id', userId),
  ])

  const payload = {
    export_metadata: {
      generated_at: new Date().toISOString(),
      user_id:      userId,
      email:        user.email,
      legal_basis:  'RGPD art. 20 - Droit à la portabilité des données',
      retention:    'Cet export est généré à la demande et n\'est pas archivé côté serveur.',
    },
    auth: {
      id:                 user.id,
      email:              user.email,
      phone:              user.phone,
      created_at:         user.created_at,
      last_sign_in_at:    user.last_sign_in_at,
      app_metadata:       user.app_metadata,
      user_metadata:      user.user_metadata,
    },
    profile:           profileRes.data ?? null,
    driver:            driverRes.data ?? null,
    missions_shared:   missionsSharedRes.data ?? [],
    missions_driven:   missionsDoneRes.data ?? [],
    missions_as_client: missionsClientRes.data ?? [],
    documents:         documentsRes.data ?? [],
    group_memberships: groupMembersRes.data ?? [],
    org_memberships:   orgMembersRes.data ?? [],
  }

  const filename = `taxilink-mes-donnees-${new Date().toISOString().slice(0, 10)}.json`
  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type':        'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control':       'no-store',
    },
  })
}
