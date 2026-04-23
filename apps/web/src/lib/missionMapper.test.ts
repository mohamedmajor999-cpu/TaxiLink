import { describe, it, expect } from 'vitest'
import { missionToAgendaRide } from './missionMapper'
import type { Mission } from '@/lib/supabase/types'

function makeMission(overrides: Partial<Mission> = {}): Mission {
  return {
    id: 'mission-1',
    type: 'CPAM',
    status: 'AVAILABLE',
    departure: '10 rue de la Paix',
    destination: 'Hôpital Lariboisière',
    scheduled_at: '2026-04-12T14:30:00Z',
    driver_id: 'driver-1',
    patient_name: 'Jean Dupont',
    phone: '0601020304',
    distance_km: 5.2,
    price_eur: 28,
    price_min_eur: null,
    price_max_eur: null,
    client_id: null,
    created_at: '2026-04-10T10:00:00Z',
    departement: null,
    accepted_at: null,
    completed_at: null,
    departure_lat: null,
    departure_lng: null,
    destination_lat: null,
    destination_lng: null,
    duration_min: null,
    notes: null,
    updated_at: '2026-04-10T10:00:00Z',
    shared_by: null,
    visibility: 'assigned',
    medical_motif: null,
    return_trip: false,
    return_time: null,
    transport_type: null,
    companion: false,
    passengers: null,
    ...overrides,
  }
}

describe('missionToAgendaRide', () => {
  it('mappe les champs de base correctement', () => {
    const result = missionToAgendaRide(makeMission())
    expect(result.id).toBe('mission-1')
    expect(result.departure).toBe('10 rue de la Paix')
    expect(result.destination).toBe('Hôpital Lariboisière')
    expect(result.scheduledAt).toBe('2026-04-12T14:30:00Z')
    expect(result.driverId).toBe('driver-1')
  })

  it('conserve le type CPAM valide', () => {
    const result = missionToAgendaRide(makeMission({ type: 'CPAM' }))
    expect(result.type).toBe('CPAM')
  })

  it('conserve le type PRIVE valide', () => {
    const result = missionToAgendaRide(makeMission({ type: 'PRIVE' }))
    expect(result.type).toBe('PRIVE')
  })

  it('conserve le type TAXILINK valide', () => {
    const result = missionToAgendaRide(makeMission({ type: 'TAXILINK' }))
    expect(result.type).toBe('TAXILINK')
  })

  it('remplace un type inconnu par TAXILINK', () => {
    const result = missionToAgendaRide(makeMission({ type: 'INCONNU' as 'CPAM' }))
    expect(result.type).toBe('TAXILINK')
  })

  it('utilise une chaîne vide si patient_name est null', () => {
    const result = missionToAgendaRide(makeMission({ patient_name: null }))
    expect(result.patientName).toBe('')
  })

  it('utilise undefined si phone est null', () => {
    const result = missionToAgendaRide(makeMission({ phone: null }))
    expect(result.phone).toBeUndefined()
  })

  it('utilise 0 si distance_km est null', () => {
    const result = missionToAgendaRide(makeMission({ distance_km: null }))
    expect(result.distanceKm).toBe(0)
  })

  it('utilise 0 si price_eur est null', () => {
    const result = missionToAgendaRide(makeMission({ price_eur: null }))
    expect(result.priceEur).toBe(0)
  })

  it('utilise une chaîne vide si driver_id est null', () => {
    const result = missionToAgendaRide(makeMission({ driver_id: null }))
    expect(result.driverId).toBe('')
  })
})
