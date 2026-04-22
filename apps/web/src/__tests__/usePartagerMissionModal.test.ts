import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { usePartagerMissionModal } from '@/components/dashboard/driver/usePartagerMissionModal'
import type { Mission } from '@/lib/supabase/types'

// ─── Mocks services ──────────────────────────────────────────────────────────
const mockGetMyGroups     = vi.fn()
const mockGetMissionGroups = vi.fn()
const mockSubmitMission   = vi.fn()
const mockMissionStoreLoad = vi.fn()

vi.mock('@/services/groupService', () => ({
  groupService: {
    getMyGroups: (...a: unknown[]) => mockGetMyGroups(...a),
  },
}))

vi.mock('@/services/missionGroupsService', () => ({
  missionGroupsService: {
    getGroupIds: (...a: unknown[]) => mockGetMissionGroups(...a),
  },
}))

vi.mock('@/components/dashboard/driver/submitMission', () => ({
  submitMission: (...a: unknown[]) => mockSubmitMission(...a),
}))

// useMissionRoute fait du debounce + fetch : on le stub pour isoler l'orchestrateur.
vi.mock('@/components/dashboard/driver/useMissionRoute', () => ({
  useMissionRoute: () => ({
    departureCoords: null,
    destinationCoords: null,
    distanceKm: null,
    durationMin: null,
    routeGeometry: null,
    loadingRoute: false,
    routeError: null,
    setDepartureCoords: vi.fn(),
    setDestinationCoords: vi.fn(),
  }),
}))

vi.mock('@/components/dashboard/driver/useMissionPricing', () => ({
  useMissionPricing: () => ({
    effectivePrice: null,
    previewFare: { value: 0, isEstimated: false, min: null, max: null },
  }),
}))

// driverStore : usePartagerMissionModal utilise un selector useDriverStore((s) => s.driver.id).
vi.mock('@/store/driverStore', () => ({
  useDriverStore: vi.fn(),
}))

// missionStore : seule `getState().load` est utilisee.
vi.mock('@/store/missionStore', () => ({
  useMissionStore: {
    getState: () => ({ load: mockMissionStoreLoad }),
  },
}))

import { useDriverStore } from '@/store/driverStore'
const mockUseDriverStore = vi.mocked(useDriverStore)

function primeDriverStore(driverId: string | null = 'drv-1') {
  mockUseDriverStore.mockImplementation(((selector?: unknown) => {
    const state = { driver: { id: driverId } }
    return typeof selector === 'function'
      ? (selector as (s: unknown) => unknown)(state)
      : state
  }) as unknown as typeof useDriverStore)
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetMyGroups.mockResolvedValue([])
  mockGetMissionGroups.mockResolvedValue([])
  mockSubmitMission.mockResolvedValue(undefined)
  mockMissionStoreLoad.mockResolvedValue(undefined)
  primeDriverStore('drv-1')
})

// ─── Chargement des groupes au montage ───────────────────────────────────────
describe('usePartagerMissionModal — chargement des groupes', () => {
  it('charge les groupes du chauffeur au montage', async () => {
    const g1 = { id: 'g1', name: 'Groupe 1' }
    mockGetMyGroups.mockResolvedValueOnce([g1])

    const { result } = renderHook(() => usePartagerMissionModal(vi.fn()))
    await waitFor(() => expect(result.current.myGroups).toEqual([g1]))
    expect(mockGetMyGroups).toHaveBeenCalledWith('drv-1')
  })

  it('pre-selectionne le premier groupe pour une nouvelle mission', async () => {
    const g1 = { id: 'g1', name: 'Groupe 1' }
    const g2 = { id: 'g2', name: 'Groupe 2' }
    mockGetMyGroups.mockResolvedValueOnce([g1, g2])

    const { result } = renderHook(() => usePartagerMissionModal(vi.fn()))
    await waitFor(() => expect(result.current.groupIds).toEqual(['g1']))
  })

  it('bascule en visibility PUBLIC si aucun groupe (nouvelle mission)', async () => {
    mockGetMyGroups.mockResolvedValueOnce([])

    const { result } = renderHook(() => usePartagerMissionModal(vi.fn()))
    await waitFor(() => expect(result.current.visibility).toBe('PUBLIC'))
  })

  it("reutilise les groupes associes d'une mission existante (edition)", async () => {
    const g1 = { id: 'g1', name: 'Groupe 1' }
    const g2 = { id: 'g2', name: 'Groupe 2' }
    mockGetMyGroups.mockResolvedValueOnce([g1, g2])
    mockGetMissionGroups.mockResolvedValueOnce(['g2'])

    const mission = { id: 'm1', scheduled_at: '2026-05-01T09:30:00.000Z' } as unknown as Mission
    const { result } = renderHook(() => usePartagerMissionModal(vi.fn(), mission))
    await waitFor(() => expect(result.current.groupIds).toEqual(['g2']))
    expect(mockGetMissionGroups).toHaveBeenCalledWith('m1')
  })

  it('isEdit est true si une mission est fournie', () => {
    const mission = { id: 'm1', scheduled_at: '2026-05-01T09:30:00.000Z' } as unknown as Mission
    const { result } = renderHook(() => usePartagerMissionModal(vi.fn(), mission))
    expect(result.current.isEdit).toBe(true)
  })
})

// ─── Visibilite / groupes ────────────────────────────────────────────────────
describe('usePartagerMissionModal — visibilite', () => {
  it('onSelectPublic passe en PUBLIC et efface groupIds', async () => {
    const g1 = { id: 'g1', name: 'Groupe 1' }
    mockGetMyGroups.mockResolvedValueOnce([g1])

    const { result } = renderHook(() => usePartagerMissionModal(vi.fn()))
    await waitFor(() => expect(result.current.groupIds).toEqual(['g1']))

    act(() => { result.current.onSelectPublic() })
    expect(result.current.visibility).toBe('PUBLIC')
    expect(result.current.groupIds).toEqual([])
  })

  it('onToggleGroup bascule en GROUP et ajoute / retire un id', async () => {
    const { result } = renderHook(() => usePartagerMissionModal(vi.fn()))
    await waitFor(() => expect(result.current.myGroups).toEqual([]))

    act(() => { result.current.onToggleGroup('gX') })
    expect(result.current.visibility).toBe('GROUP')
    expect(result.current.groupIds).toEqual(['gX'])

    act(() => { result.current.onToggleGroup('gX') })
    expect(result.current.groupIds).toEqual([])
  })
})

// ─── Adresses ────────────────────────────────────────────────────────────────
describe('usePartagerMissionModal — adresses', () => {
  it('onSelectDeparture met a jour le label de depart', async () => {
    const { result } = renderHook(() => usePartagerMissionModal(vi.fn()))
    await waitFor(() => expect(result.current.myGroups).toEqual([]))

    act(() => {
      result.current.onSelectDeparture({ label: '1 rue A, Paris', lat: 48.8, lng: 2.3, score: 1 })
    })
    expect(result.current.departure).toBe('1 rue A, Paris')
  })
})

// ─── canSubmit ───────────────────────────────────────────────────────────────
describe('usePartagerMissionModal — canSubmit', () => {
  it('canSubmit est false si departure trop court', async () => {
    const { result } = renderHook(() => usePartagerMissionModal(vi.fn()))
    await waitFor(() => expect(result.current.myGroups).toEqual([]))

    act(() => {
      result.current.setDeparture('abc')
      result.current.setDestination('10 rue B, Lyon')
      result.current.setVisibility('PUBLIC')
    })
    expect(result.current.canSubmit).toBe(false)
  })

  it('canSubmit est false en CPAM sans patient name', async () => {
    const { result } = renderHook(() => usePartagerMissionModal(vi.fn()))
    await waitFor(() => expect(result.current.visibility).toBe('PUBLIC'))

    act(() => {
      result.current.setType('CPAM')
      result.current.setMedicalMotif('HDJ')
      result.current.setDeparture('10 rue A, Paris')
      result.current.setDestination('20 rue B, Lyon')
    })
    expect(result.current.canSubmit).toBe(false)
  })

  it('canSubmit est false en GROUP sans groupes selectionnes', async () => {
    const { result } = renderHook(() => usePartagerMissionModal(vi.fn()))
    await waitFor(() => expect(result.current.visibility).toBe('PUBLIC'))

    act(() => {
      result.current.setType('PRIVE')
      result.current.setDeparture('10 rue A, Paris')
      result.current.setDestination('20 rue B, Lyon')
      result.current.setVisibility('GROUP')
      result.current.setGroupIds([])
    })
    expect(result.current.canSubmit).toBe(false)
  })

  it('canSubmit est true pour une mission PRIVE PUBLIC valide', async () => {
    const { result } = renderHook(() => usePartagerMissionModal(vi.fn()))
    await waitFor(() => expect(result.current.visibility).toBe('PUBLIC'))

    act(() => {
      result.current.setType('PRIVE')
      result.current.setDeparture('10 rue A, Paris')
      result.current.setDestination('20 rue B, Lyon')
    })
    expect(result.current.canSubmit).toBe(true)
  })
})

// ─── preview ─────────────────────────────────────────────────────────────────
describe('usePartagerMissionModal — preview', () => {
  it('showPreview ouvre la preview et efface error', async () => {
    const { result } = renderHook(() => usePartagerMissionModal(vi.fn()))
    await waitFor(() => expect(result.current.myGroups).toEqual([]))

    act(() => { result.current.showPreview() })
    expect(result.current.preview).toBe(true)
    expect(result.current.error).toBeNull()

    act(() => { result.current.hidePreview() })
    expect(result.current.preview).toBe(false)
  })
})

// ─── submit ──────────────────────────────────────────────────────────────────
describe('usePartagerMissionModal — submit', () => {
  it('succes : appelle submitMission puis missionStore.load et passe published a true', async () => {
    const { result } = renderHook(() => usePartagerMissionModal(vi.fn()))
    await waitFor(() => expect(result.current.visibility).toBe('PUBLIC'))

    await act(async () => { await result.current.submit() })

    expect(mockSubmitMission).toHaveBeenCalledTimes(1)
    expect(mockMissionStoreLoad).toHaveBeenCalledWith('drv-1')
    expect(result.current.published).toBe(true)
    expect(result.current.saving).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('echec : met error et garde la preview ouverte', async () => {
    mockSubmitMission.mockRejectedValueOnce(new Error('Validation: champ manquant'))

    const { result } = renderHook(() => usePartagerMissionModal(vi.fn()))
    await waitFor(() => expect(result.current.visibility).toBe('PUBLIC'))

    act(() => { result.current.showPreview() })
    await act(async () => { await result.current.submit() })

    expect(result.current.error).toBe('Validation: champ manquant')
    expect(result.current.preview).toBe(true)
    expect(result.current.published).toBe(false)
    expect(result.current.saving).toBe(false)
  })

  it("echec sans Error : message par defaut 'Erreur lors de la publication'", async () => {
    mockSubmitMission.mockRejectedValueOnce('string boom')

    const { result } = renderHook(() => usePartagerMissionModal(vi.fn()))
    await waitFor(() => expect(result.current.visibility).toBe('PUBLIC'))

    await act(async () => { await result.current.submit() })
    expect(result.current.error).toBe('Erreur lors de la publication')
  })

  it('succes edition : appelle missionStore.load meme si mission fournie', async () => {
    const mission = { id: 'm1', scheduled_at: '2026-05-01T09:30:00.000Z' } as unknown as Mission
    const { result } = renderHook(() => usePartagerMissionModal(vi.fn(), mission))
    await waitFor(() => expect(result.current.myGroups).toEqual([]))

    await act(async () => { await result.current.submit() })
    expect(mockSubmitMission).toHaveBeenCalledWith(expect.objectContaining({ mission }))
    expect(mockMissionStoreLoad).toHaveBeenCalledWith('drv-1')
    expect(result.current.published).toBe(true)
  })
})
