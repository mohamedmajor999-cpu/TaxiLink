import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createServerSupabaseClient as createClient } from '@/lib/supabase/server'

// Endpoint appele par navigator.sendBeacon() quand le chauffeur ferme son
// onglet. Le beacon ne lit pas la reponse, n'envoie pas de headers custom,
// mais transporte les cookies de session — donc l'auth SSR de Supabase fonctionne.
// On flip simplement is_online=false pour que le pin disparaisse instantanement
// chez les autres membres du groupe, sans attendre l'expiration TTL de 120s.
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new NextResponse(null, { status: 401 })

    await supabase
      .from('drivers')
      .update({ is_online: false })
      .eq('id', user.id)

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    // sendBeacon ignore la reponse, mais on capture quand meme dans Sentry —
    // un echec ici signifie qu'un chauffeur reste fantome jusqu'au TTL 120s.
    Sentry.captureException(err, { tags: { route: 'driver-offline-beacon' } })
    return new NextResponse(null, { status: 204 })
  }
}
