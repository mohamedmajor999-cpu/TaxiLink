import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { usePostedTab } from '@/components/dashboard/driver/courses/usePostedTab'
import type { Mission } from '@/lib/supabase/types'

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockRemove = vi.fn()
const mockAddToast = vi.fn()
const mockDismissToast = vi.fn()

// Supabase chain mock : terminal .order() → missions, .in() → profiles
const chain = {
  from:   vi.fn(),
  select: vi.fn(),
  eq:     vi.fn(),
  neq:    vi.fn(),
  order:  vi.fn(),
  in:     vi.fn(),
}
chain.from.mockReturnValue(chain)
chain.select.mockReturnValue(chain)
chain.eq.mockReturnValue(chain)
chain.neq.mockReturnValue(chain)

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => chain,
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/hooks/useToasts', () => ({
  useToasts: vi.fn(),
}))

// Capture des callbacks realtime pour tests optionnels
let realtimeCallbacks: { onInsert?: (m: unknown) => void; onUpdate?: (m: unknown) => void } = {}
vi.mock('@/hooks/useMissionRealtime', () => ({
  useMissionRealtime: vi.fn((cbs) => { realtimeCallbacks = cbs }),
}))

vi.mock('@/services/missionService', () => ({
  missionService: {
    remove: (...a: unknown[]) => mockRemove(...a),
  },
}))

import { useAuth } from '@/hooks/useAuth'
import { useToasts } from '@/hooks/useToasts'
const mockUseAuth   = vi.mocked(useAuth)
const mockUseToasts = vi.mocked(useToasts)

function primeAuth(userId: string | null = 'u1') {
  mockUseAuth.mockReturnValue({ user: userId ? { id: userId } : null, loading: false } as ReturnType<typeof useAuth>)
}

function makeMission(id: string, status: string, driver_id: string | null = null): Mission {
  return { id, status, driver_id, departure: 'A', destination: 'B' } as unknown as Mission
}

beforeEach(() => {
  vi.clearAllMocks()
  realtimeCallbacks = {}
  primeAuth()
  mockUseToasts.mockReturnValue({
    toasts: [],
    addToast: mockAddToast,
    dismissToast: mockDismissToast,
  } as unknown as ReturnType<typeof useToasts>)
  chain.order.mockResolvedValue({ data: [], error: null })
  chain.in.mockResolvedValue({ data: [], error: null })
  mockRemove.mockResolvedValue(undefined)
  vi.spyOn(window, 'confirm').mockReturnValue(true)
})

// ─── Chargement ───────────────────────────────────────────────────────────────
describe('usePostedTab — chargement', () => {
  it('ne charge pas si user est null', () => {
    primeAuth(null)
    renderHook(() => usePostedTab())
    expect(chain.from).not.toHaveBeenCalled()
  })

  it('interroge la table missions avec les bons filtres', async () => {
    const { result } = renderHook(() => usePostedTab())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(chain.from).toHaveBeenCalledWith('missions')
    expect(chain.eq).toHaveBeenCalledWith('shared_by', 'u1')
    expect(chain.neq).toHaveBeenCalledWith('status', 'DONE')
  })

  it('met loading à false après chargement', async () => {
    const { result } = renderHook(() => usePostedTab())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBeNull()
  })

  it('met error si la requête Supabase échoue', async () => {
    chain.order.mockResolvedValueOnce({ data: null, error: { message: 'timeout' } })
    const { result } = renderHook(() => usePostedTab())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('timeout')
  })
})

// ─── items — statut waiting / accepted ───────────────────────────────────────
describe('usePostedTab — items', () => {
  it('mission AVAILABLE → status "waiting"', async () => {
    chain.order.mockResolvedValueOnce({
      data: [makeMission('m1', 'AVAILABLE')],
      error: null,
    })
    const { result } = renderHook(() => usePostedTab())
    await waitFor(() => expect(result.current.items).toHaveLength(1))
    expect(result.current.items[0].status).toBe('waiting')
    expect(result.current.items[0].mission.id).toBe('m1')
  })

  it('mission IN_PROGRESS → status "accepted"', async () => {
    chain.order.mockResolvedValueOnce({
      data: [makeMission('m1', 'IN_PROGRESS')],
      error: null,
    })
    const { result } = renderHook(() => usePostedTab())
    await waitFor(() => expect(result.current.items).toHaveLength(1))
    expect(result.current.items[0].status).toBe('accepted')
  })

  it('charge le profil du chauffeur si driver_id est défini', async () => {
    chain.order.mockResolvedValueOnce({
      data: [makeMission('m1', 'IN_PROGRESS', 'drv-1')],
      error: null,
    })
    chain.in.mockResolvedValueOnce({
      data: [{ id: 'drv-1', full_name: 'Youssef B', phone: '0600000000' }],
      error: null,
    })
    const { result } = renderHook(() => usePostedTab())
    await waitFor(() => expect(result.current.items).toHaveLength(1))
    expect(result.current.items[0].driverProfile).toEqual({
      full_name: 'Youssef B',
      phone: '0600000000',
    })
  })

  it("driverProfile est undefined si la mission n'a pas de driver_id", async () => {
    chain.order.mockResolvedValueOnce({
      data: [makeMission('m1', 'AVAILABLE', null)],
      error: null,
    })
    const { result } = renderHook(() => usePostedTab())
    await waitFor(() => expect(result.current.items).toHaveLength(1))
    expect(result.current.items[0].driverProfile).toBeUndefined()
  })
})

// ─── remove ──────────────────────────────────────────────────────────────────
describe('usePostedTab — remove', () => {
  it('supprime la mission et ajoute un toast succès', async () => {
    chain.order.mockResolvedValue({
      data: [makeMission('m1', 'AVAILABLE')],
      error: null,
    })
    const { result } = renderHook(() => usePostedTab())
    await waitFor(() => expect(result.current.items).toHaveLength(1))

    await act(async () => { await result.current.remove('m1') })
    expect(mockRemove).toHaveBeenCalledWith('m1')
    expect(mockAddToast).toHaveBeenCalledWith(expect.objectContaining({ message: 'Course supprimée' }))
  })

  it("n'appelle pas missionService.remove si confirm=false", async () => {
    vi.spyOn(window, 'confirm').mockReturnValueOnce(false)
    chain.order.mockResolvedValueOnce({ data: [makeMission('m1', 'AVAILABLE')], error: null })
    const { result } = renderHook(() => usePostedTab())
    await waitFor(() => expect(result.current.items).toHaveLength(1))

    await act(async () => { await result.current.remove('m1') })
    expect(mockRemove).not.toHaveBeenCalled()
  })

  it('ajoute un toast warning si la suppression échoue', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    mockRemove.mockRejectedValueOnce(new Error('permission refusée'))
    chain.order.mockResolvedValue({ data: [makeMission('m1', 'AVAILABLE')], error: null })
    const { result } = renderHook(() => usePostedTab())
    await waitFor(() => expect(result.current.items).toHaveLength(1))

    await act(async () => { await result.current.remove('m1') })
    expect(mockAddToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'warning' }))
  })

  it('deletingId est null après suppression', async () => {
    chain.order.mockResolvedValue({ data: [makeMission('m1', 'AVAILABLE')], error: null })
    const { result } = renderHook(() => usePostedTab())
    await waitFor(() => expect(result.current.items).toHaveLength(1))

    await act(async () => { await result.current.remove('m1') })
    expect(result.current.deletingId).toBeNull()
  })
})

// ─── real-time ────────────────────────────────────────────────────────────────
describe('usePostedTab — real-time', () => {
  it('onUpdate déclenche un toast si la mission passe de AVAILABLE à IN_PROGRESS', async () => {
    chain.order.mockResolvedValue({
      data: [makeMission('m1', 'AVAILABLE')],
      error: null,
    })
    const { result } = renderHook(() => usePostedTab())
    await waitFor(() => expect(result.current.items).toHaveLength(1))

    await act(async () => {
      realtimeCallbacks.onUpdate?.({ id: 'm1', shared_by: 'u1', status: 'IN_PROGRESS', departure: 'A', destination: 'B' })
    })
    expect(mockAddToast).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Votre course a été prise !' })
    )
  })
})
