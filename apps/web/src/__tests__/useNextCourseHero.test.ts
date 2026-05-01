import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useNextCourseHero } from '@/components/dashboard/driver/courses/today/useNextCourseHero'
import type { Mission } from '@/lib/supabase/types'

const mockMarkEnRoute = vi.fn().mockResolvedValue(undefined)
const mockMarkOnBoard = vi.fn().mockResolvedValue(undefined)
const mockGetGpsPref = vi.fn()

vi.mock('@/services/missionProgressMutations', () => ({
  missionProgressMutations: {
    markEnRoute: (...a: unknown[]) => mockMarkEnRoute(...a),
    markOnBoard: (...a: unknown[]) => mockMarkOnBoard(...a),
  },
}))
vi.mock('@/services/userPrefsService', () => ({
  userPrefsService: { getGpsPref: () => mockGetGpsPref() },
}))

let openSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  vi.clearAllMocks()
  mockGetGpsPref.mockResolvedValue('waze')
  openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
})

function makeMission(extra: Partial<Mission> = {}): Mission {
  return {
    id: 'm1',
    scheduled_at: '2026-05-02T11:00:00.000Z',
    departure: '12 rue des Lilas, Marseille',
    destination: 'Hôpital de la Timone',
    status: 'IN_PROGRESS',
    enroute_at: null,
    pickup_at: null,
    no_show: false,
    ...extra,
  } as unknown as Mission
}

describe('useNextCourseHero — étape (step)', () => {
  it("step = 'toPickup' tant que pickup_at est null", () => {
    const { result } = renderHook(() => useNextCourseHero({ mission: makeMission() }))
    expect(result.current.step).toBe('toPickup')
    expect(result.current.targetAddress).toBe('12 rue des Lilas, Marseille')
  })

  it("step = 'toDestination' une fois pickup_at posé", () => {
    const m = makeMission({ pickup_at: '2026-05-02T11:30:00.000Z' })
    const { result } = renderHook(() => useNextCourseHero({ mission: m }))
    expect(result.current.step).toBe('toDestination')
    expect(result.current.targetAddress).toBe('Hôpital de la Timone')
  })
})

describe('useNextCourseHero — actions', () => {
  it('goToPickup pose enroute_at si IN_PROGRESS et pas encore posé', async () => {
    const { result } = renderHook(() => useNextCourseHero({ mission: makeMission() }))
    await waitFor(() => expect(result.current.prefLoaded).toBe(true))
    await act(async () => { await result.current.goToPickup() })
    expect(mockMarkEnRoute).toHaveBeenCalledWith('m1')
  })

  it("goToPickup ne re-pose pas enroute_at si déjà présent", async () => {
    const m = makeMission({ enroute_at: '2026-05-02T10:50:00.000Z' })
    const { result } = renderHook(() => useNextCourseHero({ mission: m }))
    await waitFor(() => expect(result.current.prefLoaded).toBe(true))
    await act(async () => { await result.current.goToPickup() })
    expect(mockMarkEnRoute).not.toHaveBeenCalled()
  })

  it('arrivedAtPatient pose pickup_at', async () => {
    const m = makeMission({ enroute_at: '2026-05-02T10:50:00.000Z' })
    const { result } = renderHook(() => useNextCourseHero({ mission: m }))
    await waitFor(() => expect(result.current.prefLoaded).toBe(true))
    await act(async () => { await result.current.arrivedAtPatient() })
    expect(mockMarkOnBoard).toHaveBeenCalledWith('m1')
  })

  it("ouvre l'URL Waze quand pref = 'waze'", async () => {
    const { result } = renderHook(() => useNextCourseHero({ mission: makeMission() }))
    await waitFor(() => expect(result.current.prefLoaded).toBe(true))
    await act(async () => { await result.current.goToPickup() })
    expect(openSpy).toHaveBeenCalled()
    const url = openSpy.mock.calls[0][0] as string
    expect(url).toContain('waze.com')
  })

  it("ouvre la NavigationSheet (askPicker) quand pref = 'ask'", async () => {
    mockGetGpsPref.mockResolvedValueOnce('ask')
    const { result } = renderHook(() => useNextCourseHero({ mission: makeMission() }))
    await waitFor(() => expect(result.current.prefLoaded).toBe(true))
    await act(async () => { await result.current.goToPickup() })
    expect(result.current.askPicker).toBe('toPickup')
    expect(openSpy).not.toHaveBeenCalled()
  })
})

describe('useNextCourseHero — erreurs', () => {
  it('expose error si markEnRoute échoue', async () => {
    mockMarkEnRoute.mockRejectedValueOnce(new Error('RLS denied'))
    const { result } = renderHook(() => useNextCourseHero({ mission: makeMission() }))
    await waitFor(() => expect(result.current.prefLoaded).toBe(true))
    await act(async () => { await result.current.goToPickup() })
    expect(result.current.error).toBe('RLS denied')
  })
})
