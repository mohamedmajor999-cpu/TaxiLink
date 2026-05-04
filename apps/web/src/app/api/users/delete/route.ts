import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

// RGPD art. 17 (droit a l'effacement) : suppression de compte avec
// anonymisation. Strategie validee par l'editeur (Q1=A) :
//   1. Anonymisation cote SQL via delete_my_account() : profil -> "Compte
//      supprime", missions PII (patient_name/phone/notes) -> NULL.
//   2. Suppression auth.users via service role : le user ne peut plus se
//      reconnecter, ses sessions actives sont invalidees.
//
// Les missions historiques sont conservees pour la traceabilite fiscale
// (factures, art. L.123-22 Code de commerce, conservation 10 ans).
export async function POST() {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  // 1) Anonymisation via la fonction SQL granted to authenticated.
  //    La fonction recupere auth.uid() en interne -> aucun risque qu'un
  //    user supprime un autre compte que le sien.
  const { error: anonErr } = await supabase.rpc('delete_my_account')
  if (anonErr) {
    return NextResponse.json(
      { error: `Anonymisation échouée : ${anonErr.message}` },
      { status: 500 }
    )
  }

  // 2) Suppression de l'entree auth.users (service role obligatoire).
  //    Apres ce point, le user est deconnecte de tous ses appareils.
  const admin = createAdminSupabaseClient()
  const { error: delErr } = await admin.auth.admin.deleteUser(user.id)
  if (delErr) {
    // L'anonymisation est faite mais la suppression auth a echoue : on
    // remonte l'erreur pour que le user retente. Le compte est dans un
    // etat coherent (donnees anonymisees) mais utilisable une derniere
    // fois — le user devra cliquer a nouveau sur Supprimer.
    return NextResponse.json(
      { error: `Anonymisé mais suppression auth échouée : ${delErr.message}` },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true, anonymized: true, deleted: true })
}
