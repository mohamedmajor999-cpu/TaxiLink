import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useMissionProgressActions } from '@/hooks/useMissionProgressActions'
import type { Mission } from '@/lib/supabase/types'

const mockMarkEnRoute = vi.fn()
const mockMarkOnBoard = vi.fn()
const mockMarkDropped = vi.fn()

vi.mock('@/services/missionService', () => ({
  missionService: {
    markEnRoute: (...a: unknown[]) => mockMarkEnRoute(...a),
    markOnBoard: (...a: unknown[]) => mockMarkOnBoard(...a),
    markDropped: (...a: unknown[]) => mockMarkDropped(...a),
  },
}))

function m(overrides: Partial<Mission>): Mission {
  return {
    id: 'm1',
    status: 'IN_PROGRESS',
    no_show: false,
    enroute_at: null,
    pickup_at: null,
    dropoff_at: null,
    ...overrides,
  } as unknown as Mission
}

beforeEach(() => {
  vi.clearAllMocks()
  mockMarkEnRoute.mockResolvedValue(undefined)
  mockMarkOnBoard.mockResolvedValue(undefined)
  mockMarkDropped.mockResolvedValue(undefined)
})

describe('useMissionProgressActions', () => {
  it("retourne 'accepted' et appelle markEnRoute quand step=accepted", async () => {
    const onUpdate = vi.fn()
    const mission = m({})
    const { result } = renderHook(() => useMissionProgressActions(mission, onUpdate))
    expect(result.current.step).toBe('accepted')

    await act(async () => { await result.current.advanceStep() })
    expect(mockMarkEnRoute).toHaveBeenCalledWith('m1')
    expect(mockMarkOnBoard).not.toHaveBeenCalled()
    expect(onUpdate).toHaveBeenCalledTimes(1)
    expect(onUpdate.mock.calls[0][0].enroute_at).toBeTruthy()
  })

  it("appelle markOnBoard quand step=enroute", async () => {
    const onUpdate = vi.fn()
    const mission = m({ enroute_at: '2026-05-01T10:00:00Z' })
    const { result } = renderHook(() => useMissionProgressActions(mission, onUpdate))
    expect(result.current.step).toBe('enroute')

    await act(async () => { await result.current.advanceStep() })
    expect(mockMarkOnBoard).toHaveBeenCalledWith('m1')
    expect(onUpdate.mock.calls[0][0].pickup_at).toBeTruthy()
  })

  it("appelle markDropped quand step=onboard", async () => {
    const onUpdate = vi.fn()
    const mission = m({ enroute_at: '2026-05-01T10:00:00Z', pickup_at: '2026-05-01T10:10:00Z' })
    const { result } = renderHook(() => useMissionProgressActions(mission, onUpdate))
    expect(result.current.step).toBe('onboard')

    await act(async () => { await result.current.advanceStep() })
    expect(mockMarkDropped).toHaveBeenCalledWith('m1')
    expect(onUpdate.mock.calls[0][0].dropoff_at).toBeTruthy()
  })

  it("ne fait rien quand step=dropped (laisse complete() au consommateur)", async () => {
    const onUpdate = vi.fn()
    const mission = m({
      enroute_at: '2026-05-01T10:00:00Z',
      pickup_at: '2026-05-01T10:10:00Z',
      dropoff_at: '2026-05-01T10:30:00Z',
    })
    const { result } = renderHook(() => useMissionProgressActions(mission, onUpdate))
    expect(result.current.step).toBe('dropped')

    await act(async () => { await result.current.advanceStep() })
    expect(mockMarkEnRoute).not.toHaveBeenCalled()
    expect(mockMarkOnBoard).not.toHaveBeenCalled()
    expect(mockMarkDropped).not.toHaveBeenCalled()
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('ne plante pas quand mission est null', async () => {
    const onUpdate = vi.fn()
    const { result } = renderHook(() => useMissionProgressActions(null, onUpdate))
    expect(result.current.step).toBe('accepted')

    await act(async () => { await result.current.advanceStep() })
    expect(mockMarkEnRoute).not.toHaveBeenCalled()
  })

  it('expose advancing=true pendant la mutation', async () => {
    let resolveMark = (): void => {}
    mockMarkEnRoute.mockReturnValueOnce(new Promise<void>((res) => { resolveMark = res }))
    const onUpdate = vi.fn()
    const { result } = renderHook(() => useMissionProgressActions(m({}), onUpdate))

    let p: Promise<void> | undefined
    act(() => { p = result.current.advanceStep() })
    await waitFor(() => expect(result.current.advancing).toBe(true))

    resolveMark()
    await act(async () => { if (p) await p })
    expect(result.current.advancing).toBe(false)
  })
})
