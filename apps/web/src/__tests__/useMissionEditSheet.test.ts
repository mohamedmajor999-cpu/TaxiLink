import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useMissionEditSheet } from '@/components/dashboard/driver/courses/edit-sheet/useMissionEditSheet'
import { useMissionEditSheetStore } from '@/store/missionEditSheetStore'
import type { Mission } from '@/lib/supabase/types'

const mockCorrect = vi.fn()
vi.mock('@/services/missionCorrectionService', () => ({
  missionCorrectionService: {
    correct: (...a: unknown[]) => mockCorrect(...a),
  },
}))

function makeMission(extra: Partial<Mission> = {}): Mission {
  return {
    id: 'm1',
    departure: '12 rue des Lilas, Marseille',
    destination: 'Hôpital de la Timone',
    phone: '0612345678',
    price_eur: 38,
    status: 'IN_PROGRESS',
    ...extra,
  } as unknown as Mission
}

beforeEach(() => {
  vi.clearAllMocks()
  useMissionEditSheetStore.getState().close()
  mockCorrect.mockResolvedValue(makeMission())
})

describe('useMissionEditSheet — état initial', () => {
  it("open=false quand aucune mission n'est ouverte", () => {
    const { result } = renderHook(() => useMissionEditSheet())
    expect(result.current.open).toBe(false)
    expect(result.current.form).toBeNull()
  })

  it("open=true quand une mission est ouverte via le store", () => {
    useMissionEditSheetStore.getState().open(makeMission())
    const { result } = renderHook(() => useMissionEditSheet())
    expect(result.current.open).toBe(true)
    expect(result.current.form?.departure).toBe('12 rue des Lilas, Marseille')
    expect(result.current.form?.priceEur).toBe('38')
  })

  it("mode='corrections' par défaut sur une mission IN_PROGRESS", () => {
    useMissionEditSheetStore.getState().open(makeMission({ status: 'IN_PROGRESS' }))
    const { result } = renderHook(() => useMissionEditSheet())
    expect(result.current.mode).toBe('corrections')
    expect(result.current.editableFields.address).toBe(true)
    expect(result.current.editableFields.price).toBe(false)
  })

  it("mode='price' par défaut sur une mission DONE", () => {
    useMissionEditSheetStore.getState().open(makeMission({ status: 'DONE' }))
    const { result } = renderHook(() => useMissionEditSheet())
    expect(result.current.mode).toBe('price')
    expect(result.current.editableFields.address).toBe(false)
    expect(result.current.editableFields.price).toBe(true)
  })
})

describe('useMissionEditSheet — dirty-tracking', () => {
  it("dirty=false tant qu'on ne touche à rien", () => {
    useMissionEditSheetStore.getState().open(makeMission())
    const { result } = renderHook(() => useMissionEditSheet())
    expect(result.current.dirty).toBe(false)
  })

  it('dirty=true après modification du téléphone', async () => {
    useMissionEditSheetStore.getState().open(makeMission())
    const { result } = renderHook(() => useMissionEditSheet())
    act(() => result.current.setField('phone', '0699999999'))
    await waitFor(() => expect(result.current.dirty).toBe(true))
  })
})

describe('useMissionEditSheet — submit', () => {
  it("envoie un patch ne contenant que les champs modifiés", async () => {
    useMissionEditSheetStore.getState().open(makeMission())
    const { result } = renderHook(() => useMissionEditSheet())
    act(() => result.current.setField('phone', '0699999999'))
    await act(async () => { await result.current.submit() })
    expect(mockCorrect).toHaveBeenCalledWith('m1', { phone: '0699999999' })
  })

  it("en mode price, ne pousse que price_eur même si d'autres champs étaient dirty", async () => {
    useMissionEditSheetStore.getState().open(makeMission({ status: 'DONE' }))
    const { result } = renderHook(() => useMissionEditSheet())
    act(() => result.current.setField('priceEur', '42'))
    await act(async () => { await result.current.submit() })
    expect(mockCorrect).toHaveBeenCalledWith('m1', { price_eur: 42 })
  })

  it("ferme le store après succès", async () => {
    useMissionEditSheetStore.getState().open(makeMission())
    const { result } = renderHook(() => useMissionEditSheet())
    act(() => result.current.setField('phone', '0699999999'))
    await act(async () => { await result.current.submit() })
    expect(useMissionEditSheetStore.getState().mission).toBeNull()
  })

  it("expose error si le service échoue", async () => {
    mockCorrect.mockRejectedValueOnce(new Error('Accès refusé'))
    useMissionEditSheetStore.getState().open(makeMission())
    const { result } = renderHook(() => useMissionEditSheet())
    act(() => result.current.setField('phone', '0699999999'))
    await act(async () => { await result.current.submit() })
    expect(result.current.error).toBe('Accès refusé')
    expect(useMissionEditSheetStore.getState().mission).not.toBeNull()
  })

  it("ne fait rien si dirty=false", async () => {
    useMissionEditSheetStore.getState().open(makeMission())
    const { result } = renderHook(() => useMissionEditSheet())
    await act(async () => { await result.current.submit() })
    expect(mockCorrect).not.toHaveBeenCalled()
  })
})

describe('useMissionEditSheet — vide → null pour phone et price', () => {
  it("phone vide → null dans le patch", async () => {
    useMissionEditSheetStore.getState().open(makeMission())
    const { result } = renderHook(() => useMissionEditSheet())
    act(() => result.current.setField('phone', ''))
    await act(async () => { await result.current.submit() })
    expect(mockCorrect).toHaveBeenCalledWith('m1', { phone: null })
  })

  it("price vide → null dans le patch", async () => {
    useMissionEditSheetStore.getState().open(makeMission({ status: 'DONE' }))
    const { result } = renderHook(() => useMissionEditSheet())
    act(() => result.current.setField('priceEur', ''))
    await act(async () => { await result.current.submit() })
    expect(mockCorrect).toHaveBeenCalledWith('m1', { price_eur: null })
  })

  it("price avec virgule décimale est correctement parsé", async () => {
    useMissionEditSheetStore.getState().open(makeMission({ status: 'DONE' }))
    const { result } = renderHook(() => useMissionEditSheet())
    act(() => result.current.setField('priceEur', '42,50'))
    await act(async () => { await result.current.submit() })
    expect(mockCorrect).toHaveBeenCalledWith('m1', { price_eur: 42.5 })
  })
})
