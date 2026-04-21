import { describe, it, expect } from 'vitest'
import { computeDisplayFare } from '@/lib/missionFare'
import type { Mission } from '@/lib/supabase/types'

function mkMission(overrides: Partial<Mission> = {}): Mission {
  return {
    id: 'm1',
    client_id: 'c1',
    driver_id: null,
    status: 'AVAILABLE',
    departure: 'Marseille Saint-Charles, 13001 Marseille',
    destination: 'Hôpital Nord, 13015 Marseille',
    departure_lat: null, departure_lng: null,
    destination_lat: null, destination_lng: null,
    distance_km: 10,
    duration_min: 20,
    price_eur: null,
    price_min_eur: null,
    price_max_eur: null,
    patient_name: null,
    phone: null,
    notes: null,
    scheduled_at: '2026-06-15T10:00:00Z',
    type: 'PRIVE',
    medical_motif: null,
    accepted_at: null,
    completed_at: null,
    created_at: '2026-06-10T00:00:00Z',
    updated_at: '2026-06-10T00:00:00Z',
    shared_by: null,
    visibility: 'PUBLIC',
    return_trip: false,
    return_time: null,
    transport_type: null,
    companion: false,
    passengers: null,
    ...overrides,
  }
}

describe('computeDisplayFare', () => {
  it('retourne le prix manuel quand price_eur est renseigné', () => {
    const m = mkMission({ price_eur: 85 })
    expect(computeDisplayFare(m)).toEqual({ value: 85, isEstimated: false })
  })

  it('traite price_eur = 0 comme absent et tente une estimation', () => {
    const m = mkMission({ price_eur: 0 })
    const r = computeDisplayFare(m)
    expect(r.isEstimated).toBe(true)
    expect(r.value).toBeGreaterThan(0)
  })

  it('estime un tarif PRIVE quand price_eur est null', () => {
    const m = mkMission({ price_eur: null, type: 'PRIVE', distance_km: 10 })
    const r = computeDisplayFare(m)
    expect(r.isEstimated).toBe(true)
    expect(r.value).toBeGreaterThan(0)
  })

  it('estime un tarif CPAM quand motif HDJ et distance connus', () => {
    const m = mkMission({
      price_eur: null, type: 'CPAM', medical_motif: 'HDJ', distance_km: 12,
    })
    const r = computeDisplayFare(m)
    expect(r.isEstimated).toBe(true)
    expect(r.value).toBeGreaterThan(0)
  })

  it('retourne 0 non-estimé si CPAM sans motif médical', () => {
    const m = mkMission({ price_eur: null, type: 'CPAM', medical_motif: null })
    expect(computeDisplayFare(m)).toEqual({ value: 0, isEstimated: false })
  })

  it('retourne 0 non-estimé si distance est null', () => {
    const m = mkMission({ price_eur: null, type: 'PRIVE', distance_km: null })
    expect(computeDisplayFare(m)).toEqual({ value: 0, isEstimated: false })
  })
})
