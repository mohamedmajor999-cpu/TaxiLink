import { createClient } from '@/lib/supabase/client'
import { extractDepartement } from '@/lib/departement'
import type { Mission } from '@/lib/supabase/types'

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
 * client_id IS NULL : on ne touche jamais à une course du réseau ni à une
 * course déjà engagée (IN_PROGRESS/DONE).
 */
export const missionManualService = {
  async create(driverId: string, data: ManualMissionInput): Promise<Mission> {
    const supabase = createClient()
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
    const supabase = createClient()
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
    const supabase = createClient()
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
