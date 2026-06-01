import { getSupabaseClient } from '@taxilink/services';
import type { MissionInput } from '@taxilink/core';
import { extractDepartement, validateMission } from '@taxilink/core';

/**
 * Mobile-only : crée une mission via insert Supabase direct, sans passer par
 * `/api/missions`. Réplique la logique serveur Next.js :
 * - Validation business via `validateMission` (cross-platform)
 * - Auth via RLS (`auth.uid() = client_id`)
 * - Calcul du département depuis l'adresse de départ
 * - Insert mission + replaceMissionGroups si visibility=GROUP
 *
 * Retourne la mission créée (avec id). Lève une Error si validation ou insert KO.
 *
 * Note : le dispatch automatique (Edge Function `dispatch_mission`) et le push
 * notif `notify_drivers_new_mission` sont déclenchés par un trigger DB ; pas
 * besoin de les appeler manuellement ici comme le fait /api/missions.
 */
export async function createMissionMobile(input: MissionInput): Promise<{ id: string }> {
  const errors = validateMission(input);
  const first = errors[0];
  if (first) throw new Error(first.message);

  const supabase = getSupabaseClient();
  const { data: userData, error: authErr } = await supabase.auth.getUser();
  if (authErr || !userData.user) throw new Error('Non authentifié');
  const userId = userData.user.id;

  const visibility = input.visibility ?? 'GROUP';
  const groupIds = visibility === 'PUBLIC' ? [] : (input.group_ids ?? []);
  const departure = input.departure.trim();

  const { data, error } = await supabase
    .from('missions')
    .insert({
      client_id: userId,
      shared_by: userId,
      type: input.type,
      medical_motif: input.type === 'CPAM' ? (input.medical_motif ?? null) : null,
      transport_type: input.type === 'CPAM' ? (input.transport_type ?? null) : null,
      return_trip: input.type === 'CPAM' ? (input.return_trip ?? false) : false,
      return_time: input.type === 'CPAM' && input.return_trip ? (input.return_time ?? null) : null,
      companion: input.companion ?? false,
      passengers: input.type !== 'CPAM' ? (input.passengers ?? null) : null,
      status: 'AVAILABLE',
      departure,
      departement: extractDepartement(departure),
      destination: input.destination.trim(),
      departure_lat: input.departure_lat ?? null,
      departure_lng: input.departure_lng ?? null,
      destination_lat: input.destination_lat ?? null,
      destination_lng: input.destination_lng ?? null,
      distance_km: input.distance_km ?? null,
      duration_min: input.duration_min ?? null,
      static_duration_min: input.static_duration_min ?? null,
      price_eur: input.price_eur ?? null,
      price_min_eur: input.price_min_eur ?? null,
      price_max_eur: input.price_max_eur ?? null,
      patient_name: input.patient_name?.trim() || null,
      phone: input.phone?.replace(/[\s\-.()/]/g, '') || null,
      notes: input.notes?.trim() || null,
      scheduled_at: input.scheduled_at ?? new Date().toISOString(),
      visibility,
    })
    .select('id')
    .single();

  if (error || !data) throw new Error(error?.message || 'Erreur lors de la création de la mission');

  if (groupIds.length > 0) {
    const rows = groupIds.map((group_id) => ({ mission_id: data.id, group_id }));
    const { error: gErr } = await supabase.from('mission_groups').insert(rows);
    if (gErr) throw new Error(gErr.message);
  }

  return { id: data.id };
}
