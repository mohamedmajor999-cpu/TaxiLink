import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient as createClient } from '@/lib/supabase/server'
import { validateMission, type MissionInput } from '@/lib/validators'
import { rateLimit } from '@/lib/rateLimiter'
import { replaceMissionGroups } from '@/services/missionGroupsService'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    if (!rateLimit(user.id, 10, 60_000)) {
      return NextResponse.json({ error: 'Trop de requêtes. Réessayez dans une minute.' }, { status: 429 })
    }

    let body: MissionInput
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 })
    }

    const errors = validateMission(body)
    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 422 })
    }

    const visibility = body.visibility ?? 'GROUP'
    const groupIds = visibility === 'PUBLIC' ? [] : (body.group_ids ?? [])

    const { data, error: insertError } = await supabase.from('missions').insert({
      client_id: user.id,
      shared_by: user.id,
      type: body.type,
      medical_motif: body.type === 'CPAM' ? (body.medical_motif ?? null) : null,
      transport_type: body.type === 'CPAM' ? (body.transport_type ?? null) : null,
      return_trip: body.type === 'CPAM' ? (body.return_trip ?? false) : false,
      return_time: body.type === 'CPAM' && body.return_trip ? (body.return_time ?? null) : null,
      companion: body.companion ?? false,
      passengers: body.type !== 'CPAM' ? (body.passengers ?? null) : null,
      status: 'AVAILABLE',
      departure: body.departure.trim(),
      destination: body.destination.trim(),
      departure_lat: body.departure_lat ?? null,
      departure_lng: body.departure_lng ?? null,
      destination_lat: body.destination_lat ?? null,
      destination_lng: body.destination_lng ?? null,
      distance_km: body.distance_km ?? null,
      duration_min: body.duration_min ?? null,
      price_eur: body.price_eur ?? null,
      price_min_eur: body.price_min_eur ?? null,
      price_max_eur: body.price_max_eur ?? null,
      patient_name: body.patient_name?.trim() || null,
      phone: body.phone?.replace(/\s/g, '') || null,
      notes: body.notes?.trim() || null,
      scheduled_at: body.scheduled_at ?? new Date().toISOString(),
      visibility,
    }).select().single()

    if (insertError || !data) {
      console.error('[POST /api/missions]', insertError)
      return NextResponse.json({ error: 'Erreur lors de la création de la mission' }, { status: 500 })
    }

    if (groupIds.length > 0) {
      try {
        await replaceMissionGroups(supabase, data.id, groupIds)
      } catch (err) {
        console.error('[POST /api/missions] mission_groups', err)
        return NextResponse.json({ error: 'Erreur lors de l\u2019affectation aux groupes' }, { status: 500 })
      }
    }

    return NextResponse.json({ mission: { ...data, group_ids: groupIds } }, { status: 201 })

  } catch (err) {
    console.error('[POST /api/missions] unexpected error', err)
    return NextResponse.json({ error: 'Erreur serveur inattendue' }, { status: 500 })
  }
}
