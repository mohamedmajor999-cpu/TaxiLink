import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient as createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rateLimiter'
import { extractDepartement } from '@/lib/departement'
import { createLogger } from '@/lib/logger'
import type { Database } from '@/lib/supabase/types'

const log = createLogger('PATCH /api/missions/[id]/correction')

type MissionUpdate = Database['public']['Tables']['missions']['Update']

// Correction post-acceptation par le chauffeur :
// - Adresses + coords + distance/duree : status IN_PROGRESS / ACCEPTED
// - price_eur (montant reel) : status DONE
// Ownership : driver_id === user.id (le chauffeur qui a accepte la course).

interface Body {
  departure?: string
  departure_lat?: number | null
  departure_lng?: number | null
  destination?: string
  destination_lat?: number | null
  destination_lng?: number | null
  distance_km?: number | null
  duration_min?: number | null
  price_eur?: number | null
  phone?: string | null
}

type RouteParams = { params: Promise<{ id: string }> }

const ADDRESS_STATUSES = new Set(['IN_PROGRESS', 'ACCEPTED'])
const PRICE_STATUSES = new Set(['DONE'])

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    if (!rateLimit(`mission-correction:${user.id}`, 20, 60_000)) {
      return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 })
    }

    const { data: mission, error: fetchError } = await supabase
      .from('missions')
      .select('id, driver_id, status')
      .eq('id', id)
      .maybeSingle()
    if (fetchError) return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    if (!mission) return NextResponse.json({ error: 'Mission introuvable' }, { status: 404 })
    if (mission.driver_id !== user.id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    let body: Body
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })
    }

    const wantsAddressEdit =
      body.departure !== undefined ||
      body.destination !== undefined ||
      body.departure_lat !== undefined ||
      body.departure_lng !== undefined ||
      body.destination_lat !== undefined ||
      body.destination_lng !== undefined ||
      body.distance_km !== undefined ||
      body.duration_min !== undefined ||
      body.phone !== undefined
    const wantsPriceEdit = body.price_eur !== undefined

    if (wantsAddressEdit && !ADDRESS_STATUSES.has(mission.status)) {
      return NextResponse.json(
        { error: 'Adresses modifiables uniquement sur une course en cours' },
        { status: 403 },
      )
    }
    if (wantsPriceEdit && !PRICE_STATUSES.has(mission.status)) {
      return NextResponse.json(
        { error: 'Prix modifiable uniquement sur une course terminée' },
        { status: 403 },
      )
    }
    if (!wantsAddressEdit && !wantsPriceEdit) {
      return NextResponse.json({ error: 'Aucun champ à modifier' }, { status: 400 })
    }

    const patch: MissionUpdate = {}
    if (body.departure !== undefined) {
      const dep = body.departure.trim()
      if (!dep) return NextResponse.json({ error: 'Adresse de départ vide' }, { status: 422 })
      patch.departure = dep
      patch.departement = extractDepartement(dep)
    }
    if (body.destination !== undefined) {
      const dst = body.destination.trim()
      if (!dst) return NextResponse.json({ error: 'Adresse de destination vide' }, { status: 422 })
      patch.destination = dst
    }
    if (body.departure_lat !== undefined) patch.departure_lat = body.departure_lat
    if (body.departure_lng !== undefined) patch.departure_lng = body.departure_lng
    if (body.destination_lat !== undefined) patch.destination_lat = body.destination_lat
    if (body.destination_lng !== undefined) patch.destination_lng = body.destination_lng
    if (body.distance_km !== undefined) patch.distance_km = body.distance_km
    if (body.duration_min !== undefined) patch.duration_min = body.duration_min
    if (body.phone !== undefined) {
      const trimmed = body.phone == null ? null : body.phone.trim()
      patch.phone = trimmed && trimmed.length > 0 ? trimmed : null
    }
    if (body.price_eur !== undefined) {
      if (body.price_eur != null && (!Number.isFinite(body.price_eur) || body.price_eur < 0)) {
        return NextResponse.json({ error: 'Prix invalide' }, { status: 422 })
      }
      patch.price_eur = body.price_eur
    }

    const { data, error: updateError } = await supabase
      .from('missions')
      .update(patch)
      .eq('id', id)
      .eq('driver_id', user.id)
      .select()
      .single()

    if (updateError || !data) {
      log.error('update failed', updateError)
      return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
    }

    return NextResponse.json({ mission: data })
  } catch (err) {
    log.error('unexpected error', err)
    return NextResponse.json({ error: 'Erreur serveur inattendue' }, { status: 500 })
  }
}
