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
    target_user_ids: null,
    medical_motif: 'HDJ',
    return_trip: false,
    return_time: null,
    transport_type: null,
    companion: false,
    passengers: null,
    view_count: 0,
    auto_completed: false,
    no_show: false,
    enroute_at: null,
    arrived_at_pickup_at: null,
    arrived_at_dest_at: null,
    pickup_at: null,
    dropoff_at: null,
    pickup_signature_url: null,
    transport_voucher_url: null,
    organization_id: null,
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
  it("false pour shared_by si la mission est encore AVAILABLE (RGPD strict avant acceptation)", () => {
    expect(canSeeFullMission(makeMission({ shared_by: 'me', status: 'AVAILABLE' }), 'me')).toBe(false)
  })
  it("true pour shared_by une fois la mission acceptee (IN_PROGRESS)", () => {
    expect(canSeeFullMission(makeMission({ shared_by: 'me', status: 'IN_PROGRESS' }), 'me')).toBe(true)
  })
  it('true pour driver_id assigne (IN_PROGRESS)', () => {
    expect(canSeeFullMission(makeMission({ driver_id: 'me', status: 'IN_PROGRESS' }), 'me')).toBe(true)
  })
  it('true pour client_id (IN_PROGRESS)', () => {
    expect(canSeeFullMission(makeMission({ client_id: 'me', status: 'IN_PROGRESS' }), 'me')).toBe(true)
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

  it('masque pour le shared_by tant que la mission est AVAILABLE (RGPD strict)', () => {
    const m = makeMission({ shared_by: 'me', status: 'AVAILABLE' })
    const result = maskMissionForViewer(m, 'me')
    expect(result.patient_name).toBe('J. D.')
    expect(result.phone).toBeNull()
    expect(result.notes).toBeNull()
  })

  it('renvoie la mission complete pour le shared_by une fois la mission acceptee', () => {
    const m = makeMission({ shared_by: 'me', status: 'IN_PROGRESS' })
    const result = maskMissionForViewer(m, 'me')
    expect(result.patient_name).toBe('Jean Dupont')
    expect(result.phone).toBe('0601020304')
    expect(result.notes).toBe('Patient sous oxygène')
  })

  it('renvoie la mission complete pour le driver_id (IN_PROGRESS)', () => {
    const m = makeMission({ driver_id: 'me', status: 'IN_PROGRESS' })
    const result = maskMissionForViewer(m, 'me')
    expect(result.patient_name).toBe('Jean Dupont')
  })
})
