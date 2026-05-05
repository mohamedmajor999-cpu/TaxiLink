import { createAdminSupabaseClient } from '@/lib/supabase/admin'

export interface PublicSharer {
  fullName: string
  initials: string
}

export interface PublicMission {
  id: string
  type: 'CPAM' | 'PRIVE' | string
  departure: string
  destination: string
  scheduled_at: string
  price_eur: number | null
  price_min_eur: number | null
  price_max_eur: number | null
  distance_km: number | null
  duration_min: number | null
  static_duration_min: number | null
  status: string
  return_trip: boolean
  medical_motif: string | null
  transport_type: string | null
  passengers: number | null
  visibility: string
  // Enrichissements pour la page de partage publique
  sharer: PublicSharer | null
  groupName: string | null
}

function buildSharer(profile: { first_name: string | null; last_name: string | null; full_name: string | null } | null): PublicSharer | null {
  if (!profile) return null
  const first = profile.first_name?.trim() ?? ''
  const last = profile.last_name?.trim() ?? ''
  const full = profile.full_name?.trim() || `${first} ${last}`.trim()
  if (!full) return null
  const initials = `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase() || full.slice(0, 2).toUpperCase()
  return { fullName: full, initials }
}

/**
 * Lit une mission par id côté serveur via service_role (bypass RLS).
 * Renvoie UNIQUEMENT les champs non-sensibles destinés à l'aperçu public
 * (jamais le numéro de téléphone, le nom du patient, les notes).
 *
 * Enrichit avec :
 * - le nom du chauffeur qui a partagé (`shared_by` → profiles)
 * - le nom du groupe ciblé si visibility === 'GROUP' (mission_groups → groups)
 *
 * Le sharer est résolu via une requête séparée car la FK
 * missions.shared_by → profiles n'est pas exposée dans les types Supabase
 * actuels — on évite la dépendance à PostgREST relationship inference.
 */
export async function fetchPublicMission(id: string): Promise<PublicMission | null> {
  const supabase = createAdminSupabaseClient()
  const { data: missionRow, error } = await supabase
    .from('missions')
    .select(`
      id, type, departure, destination, scheduled_at,
      price_eur, price_min_eur, price_max_eur,
      distance_km, duration_min, static_duration_min,
      status, return_trip, medical_motif, transport_type, passengers, visibility,
      shared_by,
      mission_groups ( groups ( name ) )
    `)
    .eq('id', id)
    .maybeSingle()
  if (error || !missionRow) return null

  const row = missionRow as Record<string, unknown>

  let sharer: PublicSharer | null = null
  const sharedById = row.shared_by as string | null
  if (sharedById) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name, full_name')
      .eq('id', sharedById)
      .maybeSingle()
    sharer = buildSharer(profile as Parameters<typeof buildSharer>[0])
  }

  const mg = (row.mission_groups ?? []) as Array<{ groups?: { name?: string | null } | null }>
  const groupName = mg[0]?.groups?.name ?? null

  return {
    id: row.id as string,
    type: row.type as string,
    departure: row.departure as string,
    destination: row.destination as string,
    scheduled_at: row.scheduled_at as string,
    price_eur: row.price_eur as number | null,
    price_min_eur: row.price_min_eur as number | null,
    price_max_eur: row.price_max_eur as number | null,
    distance_km: row.distance_km as number | null,
    duration_min: row.duration_min as number | null,
    static_duration_min: row.static_duration_min as number | null,
    status: row.status as string,
    return_trip: row.return_trip as boolean,
    medical_motif: row.medical_motif as string | null,
    transport_type: row.transport_type as string | null,
    passengers: row.passengers as number | null,
    visibility: row.visibility as string,
    sharer,
    groupName,
  }
}

/**
 * Compte le nombre de chauffeurs inscrits (role='driver'). Utilisé pour le
 * trust ribbon de la page partage publique.
 */
export async function fetchDriverCount(): Promise<number> {
  const supabase = createAdminSupabaseClient()
  const { count } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'driver')
  return count ?? 0
}
