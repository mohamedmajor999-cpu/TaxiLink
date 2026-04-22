import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useHistoryTab } from '@/components/dashboard/driver/courses/useHistoryTab'
import type { Mission } from '@/lib/supabase/types'

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockGetDoneByDriver = vi.fn()

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/services/missionService', () => ({
  missionService: {
    getDoneByDriver: (...a: unknown[]) => mockGetDoneByDriver(...a),
  },
}))

import { useAuth } from '@/hooks/useAuth'
const mockUseAuth = vi.mocked(useAuth)

function makeMission(id: string, completed_at: string, price_eur = 0): Mission {
  return { id, completed_at, scheduled_at: completed_at, price_eur } as unknown as Mission
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUseAuth.mockReturnValue({ user: { id: 'u1' }, loading: false } as ReturnType<typeof useAuth>)
  mockGetDoneByDriver.mockResolvedValue([])
})

// ─── Chargement ───────────────────────────────────────────────────────────────
describe('useHistoryTab — chargement', () => {
  it('ne charge pas sans user', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false } as ReturnType<typeof useAuth>)
    renderHook(() => useHistoryTab())
    expect(mockGetDoneByDriver).not.toHaveBeenCalled()
  })

  it('appelle getDoneByDriver avec user.id', async () => {
    const { result } = renderHook(() => useHistoryTab())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(mockGetDoneByDriver).toHaveBeenCalledWith('u1')
  })

  it('met error si le service échoue', async () => {
    mockGetDoneByDriver.mockRejectedValueOnce(new Error('KO'))
    const { result } = renderHook(() => useHistoryTab())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('KO')
  })
})

// ─── Groupes par mois ─────────────────────────────────────────────────────────
describe('useHistoryTab — groupes', () => {
  it('regroupe les missions par mois-année', async () => {
    mockGetDoneByDriver.mockResolvedValueOnce([
      makeMission('m1', '2026-05-10T10:00:00.000Z', 40),
      makeMission('m2', '2026-05-20T10:00:00.000Z', 60),
      makeMission('m3', '2026-04-15T10:00:00.000Z', 30),
    ])
    const { result } = renderHook(() => useHistoryTab())
    await waitFor(() => expect(result.current.groups).toHaveLength(2))
    // Tri décroissant : mai avant avril
    expect(result.current.groups[0].label).toContain('MAI')
    expect(result.current.groups[1].label).toContain('AVRIL')
  })

  it('total est la somme des price_eur du groupe', async () => {
    mockGetDoneByDriver.mockResolvedValueOnce([
      makeMission('m1', '2026-05-10T10:00:00.000Z', 40),
      makeMission('m2', '2026-05-20T10:00:00.000Z', 60),
    ])
    const { result } = renderHook(() => useHistoryTab())
    await waitFor(() => expect(result.current.groups).toHaveLength(1))
    expect(result.current.groups[0].total).toBe(100)
  })

  it('label est en majuscules (MOIS ANNÉE)', async () => {
    mockGetDoneByDriver.mockResolvedValueOnce([
      makeMission('m1', '2026-01-05T10:00:00.000Z'),
    ])
    const { result } = renderHook(() => useHistoryTab())
    await waitFor(() => expect(result.current.groups).toHaveLength(1))
    expect(result.current.groups[0].label).toMatch(/^[A-Z]/)
    expect(result.current.groups[0].label).toContain('2026')
  })
})
