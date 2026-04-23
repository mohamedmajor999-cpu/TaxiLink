import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient as createClient } from '@/lib/supabase/server'
import { validateMission, type MissionInput } from '@/lib/validators'
import { rateLimit } from '@/lib/rateLimiter'
import { replaceMissionGroups } from '@/services/missionGroupsService'
import { extractDepartement } from '@/lib/departement'

type RouteParams = { params: Promise<{ id: string }> }

async function requireOwnEditable(req: NextRequest, params: RouteParams['params']) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { err: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }) }
  }

  if (!rateLimit(`mission-mutate:${user.id}`, 20, 60_000)) {
    return { err: NextResponse.json({ error: 'Trop de requêtes. Réessayez dans une minute.' }, { status: 429 }) }
  }

  const { data: mission, error: fetchError } = await supabase
    .from('missions')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (fetchError) {
    console.error('[api/missions/[id]] fetch error', fetchError)
    return { err: NextResponse.json({ error: 'Erreur serveur' }, { status: 500 }) }
  }
  if (!mission) {
    return { err: NextResponse.json({ error: 'Mission introuvable' }, { status: 404 }) }
  }
  if (mission.client_id !== user.id && mission.shared_by !== user.id) {
    return { err: NextResponse.json({ error: 'Accès refusé' }, { status: 403 }) }
  }
  if (mission.status !== 'AVAILABLE') {
    return { err: NextResponse.json({ error: 'Mission déjà acceptée, modification impossible' }, { status: 403 }) }
  }

  return { supabase, user, mission, id }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const ctx = await requireOwnEditable(req, params)
    if ('err' in ctx) return ctx.err

    const { data: deleted, error: deleteError } = await ctx.supabase
      .from('missions')
      .delete()
      .eq('id', ctx.id)
      .eq('status', 'AVAILABLE')
      .or(`client_id.eq.${ctx.user.id},shared_by.eq.${ctx.user.id}`)
      .select('id')

    if (deleteError) {
      console.error('[DELETE /api/missions/[id]]', deleteError)
      return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 })
    }
    if (!deleted || deleted.length === 0) {
      return NextResponse.json(
        { error: 'Suppression refusée (policy ou mission déjà prise)' },
        { status: 403 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/missions/[id]] unexpected error', err)
    return NextResponse.json({ error: 'Erreur serveur inattendue' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const ctx = await requireOwnEditable(req, params)
    if ('err' in ctx) return ctx.err

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

    const departure = body.departure.trim()

    const { data, error: updateError } = await ctx.supabase
      .from('missions')
      .update({
        type: body.type,
        medical_motif: body.type === 'CPAM' ? (body.medical_motif ?? null) : null,
        transport_type: body.type === 'CPAM' ? (body.transport_type ?? null) : null,
        return_trip: body.type === 'CPAM' ? (body.return_trip ?? false) : false,
        return_time: body.type === 'CPAM' && body.return_trip ? (body.return_time ?? null) : null,
        companion: body.companion ?? false,
        passengers: body.type !== 'CPAM' ? (body.passengers ?? null) : null,
        departure,
        departement: extractDepartement(departure),
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
        scheduled_at: body.scheduled_at ?? ctx.mission.scheduled_at,
        visibility,
      })
      .eq('id', ctx.id)
      .eq('client_id', ctx.user.id)
      .eq('status', 'AVAILABLE')
      .select()
      .single()

    if (updateError || !data) {
      console.error('[PATCH /api/missions/[id]]', updateError)
      return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
    }

    try {
      await replaceMissionGroups(ctx.supabase, data.id, groupIds)
    } catch (err) {
      console.error('[PATCH /api/missions/[id]] mission_groups', err)
      return NextResponse.json({ error: 'Erreur lors de l\u2019affectation aux groupes' }, { status: 500 })
    }

    return NextResponse.json({ mission: { ...data, group_ids: groupIds } })
  } catch (err) {
    console.error('[PATCH /api/missions/[id]] unexpected error', err)
    return NextResponse.json({ error: 'Erreur serveur inattendue' }, { status: 500 })
  }
}
