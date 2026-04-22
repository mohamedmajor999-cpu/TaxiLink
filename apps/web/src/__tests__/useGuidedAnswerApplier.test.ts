import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGuidedAnswerApplier } from '@/components/dashboard/driver/guided/useGuidedAnswerApplier'
import type { GuidedSetters } from '@/components/dashboard/driver/guided/useGuidedAnswerApplier'
import type { Group } from '@taxilink/core'

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockSmartAddressLookup = vi.fn()

vi.mock('@/components/dashboard/driver/smartAddressLookup', () => ({
  smartAddressLookup: (...a: unknown[]) => mockSmartAddressLookup(...a),
}))

function makeSetters(): GuidedSetters {
  return {
    setType: vi.fn(), setMedicalMotif: vi.fn(), setTransportType: vi.fn(),
    setReturnTrip: vi.fn(), setReturnTime: vi.fn(), setCompanion: vi.fn(),
    setPassengers: vi.fn(), setDeparture: vi.fn(), setDestination: vi.fn(),
    setDate: vi.fn(), setTime: vi.fn(), setPatientName: vi.fn(), setPhone: vi.fn(),
    setVisibility: vi.fn(), setGroupIds: vi.fn(),
    setDepartureCoords: vi.fn(), setDestinationCoords: vi.fn(),
  }
}

const GROUPS: Group[] = [
  { id: 'g1', name: 'Groupe Alpha' },
  { id: 'g2', name: 'Groupe Beta' },
] as unknown as Group[]

beforeEach(() => {
  vi.clearAllMocks()
  mockSmartAddressLookup.mockResolvedValue(null)
})

// ─── type ─────────────────────────────────────────────────────────────────────
describe('useGuidedAnswerApplier — type', () => {
  it("type='CPAM' → setType('CPAM') + clear passengers", async () => {
    const s = makeSetters()
    const { result } = renderHook(() => useGuidedAnswerApplier(s, []))
    await act(async () => { await result.current('type', 'CPAM') })
    expect(s.setType).toHaveBeenCalledWith('CPAM')
    expect(s.setPassengers).toHaveBeenCalledWith(null)
  })

  it("type='PRIVE' → clear champs CPAM", async () => {
    const s = makeSetters()
    const { result } = renderHook(() => useGuidedAnswerApplier(s, []))
    await act(async () => { await result.current('type', 'PRIVE') })
    expect(s.setType).toHaveBeenCalledWith('PRIVE')
    expect(s.setMedicalMotif).toHaveBeenCalledWith(null)
    expect(s.setReturnTrip).toHaveBeenCalledWith(false)
    expect(s.setReturnTime).toHaveBeenCalledWith(null)
  })

  it('type inconnu → rien', async () => {
    const s = makeSetters()
    const { result } = renderHook(() => useGuidedAnswerApplier(s, []))
    await act(async () => { await result.current('type', 'INVALID') })
    expect(s.setType).not.toHaveBeenCalled()
  })
})

// ─── Champs simples ───────────────────────────────────────────────────────────
describe('useGuidedAnswerApplier — champs simples', () => {
  it('medicalMotif → setMedicalMotif', async () => {
    const s = makeSetters()
    const { result } = renderHook(() => useGuidedAnswerApplier(s, []))
    await act(async () => { await result.current('medicalMotif', 'HDJ') })
    expect(s.setMedicalMotif).toHaveBeenCalledWith('HDJ')
  })

  it('patientName → setPatientName (trim)', async () => {
    const s = makeSetters()
    const { result } = renderHook(() => useGuidedAnswerApplier(s, []))
    await act(async () => { await result.current('patientName', '  Jean Dupont  ') })
    expect(s.setPatientName).toHaveBeenCalledWith('Jean Dupont')
  })

  it('phone → setPhone (supprime espaces)', async () => {
    const s = makeSetters()
    const { result } = renderHook(() => useGuidedAnswerApplier(s, []))
    await act(async () => { await result.current('phone', '06 12 34 56 78') })
    expect(s.setPhone).toHaveBeenCalledWith('0612345678')
  })

  it('returnTrip=false → setReturnTime(null)', async () => {
    const s = makeSetters()
    const { result } = renderHook(() => useGuidedAnswerApplier(s, []))
    await act(async () => { await result.current('returnTrip', false) })
    expect(s.setReturnTrip).toHaveBeenCalledWith(false)
    expect(s.setReturnTime).toHaveBeenCalledWith(null)
  })

  it('passengers valide → setPassengers arrondi', async () => {
    const s = makeSetters()
    const { result } = renderHook(() => useGuidedAnswerApplier(s, []))
    await act(async () => { await result.current('passengers', 2.9) })
    expect(s.setPassengers).toHaveBeenCalledWith(3)
  })

  it('passengers hors plage [1,8] → ignoré', async () => {
    const s = makeSetters()
    const { result } = renderHook(() => useGuidedAnswerApplier(s, []))
    await act(async () => { await result.current('passengers', 0) })
    expect(s.setPassengers).not.toHaveBeenCalled()
  })
})

// ─── visibility ───────────────────────────────────────────────────────────────
describe('useGuidedAnswerApplier — visibility', () => {
  it("visibility='PUBLIC' → setVisibility + setGroupIds([])", async () => {
    const s = makeSetters()
    const { result } = renderHook(() => useGuidedAnswerApplier(s, []))
    await act(async () => { await result.current('visibility', 'PUBLIC') })
    expect(s.setVisibility).toHaveBeenCalledWith('PUBLIC')
    expect(s.setGroupIds).toHaveBeenCalledWith([])
  })
})

// ─── groupIds ─────────────────────────────────────────────────────────────────
describe('useGuidedAnswerApplier — groupIds', () => {
  it('groupIds avec ids valides → setGroupIds avec ces ids', async () => {
    const s = makeSetters()
    const { result } = renderHook(() => useGuidedAnswerApplier(s, GROUPS))
    await act(async () => { await result.current('groupIds', ['g1', 'g2']) })
    expect(s.setGroupIds).toHaveBeenCalledWith(['g1', 'g2'])
  })

  it('groupIds avec noms → matching par nom normalisé', async () => {
    const s = makeSetters()
    const { result } = renderHook(() => useGuidedAnswerApplier(s, GROUPS))
    await act(async () => { await result.current('groupIds', ['Groupe Alpha']) })
    expect(s.setGroupIds).toHaveBeenCalledWith(['g1'])
  })
})

// ─── departure / destination ──────────────────────────────────────────────────
describe('useGuidedAnswerApplier — adresses', () => {
  it('departure avec objet {label,lat,lng} → setDeparture + setDepartureCoords', async () => {
    const s = makeSetters()
    const { result } = renderHook(() => useGuidedAnswerApplier(s, []))
    await act(async () => {
      await result.current('departure', { label: '1 rue A', lat: 48.8, lng: 2.3 })
    })
    expect(s.setDeparture).toHaveBeenCalledWith('1 rue A')
    expect(s.setDepartureCoords).toHaveBeenCalledWith({ lat: 48.8, lng: 2.3 })
    expect(mockSmartAddressLookup).not.toHaveBeenCalled()
  })

  it('departure avec string → appelle smartAddressLookup', async () => {
    mockSmartAddressLookup.mockResolvedValueOnce({ label: '10 rue Gaulle', lat: 43.3, lng: 5.4 })
    const s = makeSetters()
    const { result } = renderHook(() => useGuidedAnswerApplier(s, []))
    await act(async () => { await result.current('departure', '10 rue Gaulle') })
    expect(mockSmartAddressLookup).toHaveBeenCalledWith('10 rue Gaulle')
    expect(s.setDeparture).toHaveBeenCalledWith('10 rue Gaulle')
    expect(s.setDepartureCoords).toHaveBeenCalledWith({ lat: 43.3, lng: 5.4 })
  })

  it('departure string sans résultat → setDeparture uniquement', async () => {
    mockSmartAddressLookup.mockResolvedValueOnce(null)
    const s = makeSetters()
    const { result } = renderHook(() => useGuidedAnswerApplier(s, []))
    await act(async () => { await result.current('departure', 'adresse inconnue') })
    expect(s.setDeparture).toHaveBeenCalledWith('adresse inconnue')
    expect(s.setDepartureCoords).not.toHaveBeenCalled()
  })
})
