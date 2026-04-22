import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMissionFormState } from '@/components/dashboard/driver/useMissionFormState'
import type { Mission } from '@/lib/supabase/types'

// Helper : construit une Mission partielle cast en Mission pour les tests.
const asMission = (m: Partial<Mission>) => m as Mission

// ─── Valeurs par defaut (nouvelle mission) ────────────────────────────────────
describe('useMissionFormState — defaults (creation)', () => {
  it('initialise type a CPAM et tous les champs vides quand mission est undefined', () => {
    const { result } = renderHook(() => useMissionFormState(undefined))
    expect(result.current.type).toBe('CPAM')
    expect(result.current.medicalMotif).toBeNull()
    expect(result.current.transportType).toBeNull()
    expect(result.current.returnTrip).toBe(false)
    expect(result.current.returnTime).toBeNull()
    expect(result.current.companion).toBe(false)
    expect(result.current.passengers).toBeNull()
    expect(result.current.visibility).toBe('GROUP')
    expect(result.current.groupIds).toEqual([])
    expect(result.current.departure).toBe('')
    expect(result.current.destination).toBe('')
    expect(result.current.price).toBe('')
    expect(result.current.priceMin).toBe('')
    expect(result.current.priceMax).toBe('')
    expect(result.current.patientName).toBe('')
    expect(result.current.phone).toBe('')
    expect(result.current.notes).toBe('')
  })
})

// ─── Pre-remplissage depuis une mission existante (edition) ──────────────────
describe('useMissionFormState — edit (mission existante)', () => {
  it('pre-remplit les champs simples depuis la mission', () => {
    const mission = asMission({
      type: 'PRIVE',
      medical_motif: null,
      transport_type: 'WHEELCHAIR',
      return_trip: true,
      return_time: '18:00',
      companion: true,
      passengers: 2,
      visibility: 'PUBLIC',
      departure: '10 rue A, Paris',
      destination: '20 rue B, Lyon',
      scheduled_at: '2026-05-01T09:30:00.000Z',
      price_eur: 42,
      price_min_eur: null,
      price_max_eur: null,
      patient_name: 'Patient X',
      phone: '0600000000',
      notes: 'fragile',
    })
    const { result } = renderHook(() => useMissionFormState(mission))
    expect(result.current.type).toBe('PRIVE')
    expect(result.current.transportType).toBe('WHEELCHAIR')
    expect(result.current.returnTrip).toBe(true)
    expect(result.current.returnTime).toBe('18:00')
    expect(result.current.companion).toBe(true)
    expect(result.current.passengers).toBe(2)
    expect(result.current.visibility).toBe('PUBLIC')
    expect(result.current.departure).toBe('10 rue A, Paris')
    expect(result.current.destination).toBe('20 rue B, Lyon')
    expect(result.current.patientName).toBe('Patient X')
    expect(result.current.phone).toBe('0600000000')
    expect(result.current.notes).toBe('fragile')
  })

  it('remplit price quand price_eur existe et price_min_eur est null', () => {
    const mission = asMission({
      type: 'CPAM',
      medical_motif: 'HDJ',
      scheduled_at: '2026-05-01T09:30:00.000Z',
      price_eur: 55,
      price_min_eur: null,
      price_max_eur: null,
    })
    const { result } = renderHook(() => useMissionFormState(mission))
    expect(result.current.medicalMotif).toBe('HDJ')
    expect(result.current.price).toBe('55')
    expect(result.current.priceMin).toBe('')
    expect(result.current.priceMax).toBe('')
  })

  it('remplit priceMin / priceMax (pas price) quand la mission a une fourchette', () => {
    const mission = asMission({
      type: 'PRIVE',
      scheduled_at: '2026-05-01T09:30:00.000Z',
      price_eur: 40,
      price_min_eur: 30,
      price_max_eur: 50,
    })
    const { result } = renderHook(() => useMissionFormState(mission))
    expect(result.current.price).toBe('')
    expect(result.current.priceMin).toBe('30')
    expect(result.current.priceMax).toBe('50')
  })

  it('visibility reste GROUP si la mission a une visibility autre que PUBLIC', () => {
    const mission = asMission({
      scheduled_at: '2026-05-01T09:30:00.000Z',
      visibility: 'GROUP',
    })
    const { result } = renderHook(() => useMissionFormState(mission))
    expect(result.current.visibility).toBe('GROUP')
  })

  it('transportType reste null pour des valeurs inconnues', () => {
    const mission = asMission({
      scheduled_at: '2026-05-01T09:30:00.000Z',
      transport_type: 'FOO' as unknown as Mission['transport_type'],
    })
    const { result } = renderHook(() => useMissionFormState(mission))
    expect(result.current.transportType).toBeNull()
  })
})

// ─── Setters ──────────────────────────────────────────────────────────────────
describe('useMissionFormState — setters', () => {
  it('setDeparture / setDestination mettent a jour les adresses', () => {
    const { result } = renderHook(() => useMissionFormState(undefined))
    act(() => {
      result.current.setDeparture('Marseille')
      result.current.setDestination('Nice')
    })
    expect(result.current.departure).toBe('Marseille')
    expect(result.current.destination).toBe('Nice')
  })

  it('setGroupIds accepte une fonction de mise a jour', () => {
    const { result } = renderHook(() => useMissionFormState(undefined))
    act(() => { result.current.setGroupIds(['g1']) })
    expect(result.current.groupIds).toEqual(['g1'])
    act(() => { result.current.setGroupIds((cur) => [...cur, 'g2']) })
    expect(result.current.groupIds).toEqual(['g1', 'g2'])
  })

  it('setType bascule entre CPAM et PRIVE', () => {
    const { result } = renderHook(() => useMissionFormState(undefined))
    act(() => { result.current.setType('PRIVE') })
    expect(result.current.type).toBe('PRIVE')
  })
})
