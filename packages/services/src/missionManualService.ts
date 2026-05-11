import { getSupabaseClient } from './lib/client'
import { extractDepartement } from '@taxilink/core'
import type { Mission } from '@taxilink/supabase-types'

export interface ManualMissionInput {
  departure: string
  destination: string
  scheduledAt: string
  type: 'CPAM' | 'PRIVE' | 'TAXILINK'
  priceEur: number | null
  patientName: string | null
  notes: string | null
}

function payload(data: ManualMissionInput) {
  return {
    departure: data.departure,
    departement: extractDepartement(data.departure),
    destination: data.destination,
    scheduled_at: data.scheduledAt,
    type: data.type,
    price_eur: data.priceEur,
    patient_name: data.patientName,
    notes: data.notes,
  }
}

/**
 * CRUD des courses manuelles (saisies chauffeur, sans client ni publication).
 * Toutes les mutations exigent status='ACCEPTED' + shared_by IS NULL +
 * client_id IS NULL : on ne touche jamais a une course du reseau ni a une
 * course deja engagee (IN_PROGRESS/DONE).
 */
export const missionManualService = {
  async create(driverId: string, data: ManualMissionInput): Promise<Mission> {
    const supabase = getSupabaseClient()
    const { data: mission, error } = await supabase
      .from('missions')
      .insert({
        driver_id: driverId,
        ...payload(data),
        status: 'ACCEPTED',
        visibility: 'PRIVATE',
      })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return mission
  },

  async update(missionId: string, data: ManualMissionInput): Promise<Mission> {
    const supabase = getSupabaseClient()
    const { data: mission, error } = await supabase
      .from('missions')
      .update(payload(data))
      .eq('id', missionId)
      .eq('status', 'ACCEPTED')
      .is('shared_by', null)
      .is('client_id', null)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return mission
  },

  async remove(missionId: string): Promise<void> {
    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from('missions')
      .delete()
      .eq('id', missionId)
      .eq('status', 'ACCEPTED')
      .is('shared_by', null)
      .is('client_id', null)
    if (error) throw new Error(error.message)
  },
}
