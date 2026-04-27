import { describe, it, expect } from 'vitest'
import { maskMissionForViewer, canSeeFullMission, maskName } from '@/lib/missionMask'
import type { Mission } from '@/lib/supabase/types'

function makeMission(overrides: Partial<Mission> = {}): Mission {
  return {
    id: 'mission-1',
    type: 'CPAM',
    status: 'AVAILABLE',
    departure: '10 rue de la Paix, Paris',
    destination: 'Hôpital Lariboisière, Paris',
    scheduled_at: '2026-04-12T14:30:00Z',
    driver_id: null,
    patient_name: 'Jean Dupont',
    phone: '0601020304',
    distance_km: 5.2,
    price_eur: 28,
    price_min_eur: null,
    price_max_eur: null,
    client_id: null,
    created_at: '2026-04-10T10:00:00Z',
    departement: '75',
    accepted_at: null,
    completed_at: null,
    departure_lat: null,
    departure_lng: null,
    destination_lat: null,
    destination_lng: null,
    duration_min: null,
    static_duration_min: null,
    notes: 'Patient sous oxygène',
    updated_at: '2026-04-10T10:00:00Z',
    shared_by: 'author-1',
    visibility: 'group',
    medical_motif: 'HDJ',
    return_trip: false,
    return_time: null,
    transport_type: null,
    companion: false,
    passengers: null,
    view_count: 0,
    ...overrides,
  }
}

describe('maskName', () => {
  it('réduit nom complet aux initiales', () => {
    expect(maskName('Jean Dupont')).toBe('J. D.')
  })
  it('gère les noms composés', () => {
    expect(maskName('Marie-Claire Dupont-Martin')).toBe('M. D.')
  })
  it('renvoie null si nom null/vide', () => {
    expect(maskName(null)).toBeNull()
    expect(maskName('')).toBeNull()
    expect(maskName('   ')).toBeNull()
  })
})

describe('canSeeFullMission', () => {
  it('false pour viewer null', () => {
    expect(canSeeFullMission(makeMission(), null)).toBe(false)
  })
  it('true pour shared_by (auteur)', () => {
    expect(canSeeFullMission(makeMission({ shared_by: 'me' }), 'me')).toBe(true)
  })
  it('true pour driver_id assigne', () => {
    expect(canSeeFullMission(makeMission({ driver_id: 'me' }), 'me')).toBe(true)
  })
  it('true pour client_id', () => {
    expect(canSeeFullMission(makeMission({ client_id: 'me' }), 'me')).toBe(true)
  })
  it('false pour viewer tiers (autre chauffeur du groupe)', () => {
    expect(canSeeFullMission(makeMission(), 'other-driver')).toBe(false)
  })
})

describe('maskMissionForViewer', () => {
  it('masque patient_name + phone + notes pour viewer tiers', () => {
    const masked = maskMissionForViewer(makeMission(), 'random-driver')
    expect(masked.patient_name).toBe('J. D.')
    expect(masked.phone).toBeNull()
    expect(masked.notes).toBeNull()
  })

  it('garde le motif medical (HDJ/CONSULTATION non sensibles)', () => {
    const masked = maskMissionForViewer(makeMission(), 'random-driver')
    expect(masked.medical_motif).toBe('HDJ')
  })

  it('preserve les autres champs (adresses, prix, distance)', () => {
    const masked = maskMissionForViewer(makeMission(), 'random-driver')
    expect(masked.departure).toBe('10 rue de la Paix, Paris')
    expect(masked.destination).toBe('Hôpital Lariboisière, Paris')
    expect(masked.price_eur).toBe(28)
    expect(masked.distance_km).toBe(5.2)
  })

  it('renvoie la mission complete pour le shared_by', () => {
    const m = makeMission({ shared_by: 'me' })
    const result = maskMissionForViewer(m, 'me')
    expect(result.patient_name).toBe('Jean Dupont')
    expect(result.phone).toBe('0601020304')
    expect(result.notes).toBe('Patient sous oxygène')
  })

  it('renvoie la mission complete pour le driver_id', () => {
    const m = makeMission({ driver_id: 'me' })
    const result = maskMissionForViewer(m, 'me')
    expect(result.patient_name).toBe('Jean Dupont')
  })
})
