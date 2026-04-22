import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useHistoryTab } from '@/components/dashboard/driver/courses/useHistoryTab'
import type { Mission } from '@/lib/supabase/types'

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockGetDoneByDriver = vi.fn()
const mockPush = vi.fn()

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/services/missionService', () => ({
  missionService: {
    getDoneByDriver: (...a: unknown[]) => mockGetDoneByDriver(...a),
  },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

import { useAuth } from '@/hooks/useAuth'
const mockUseAuth = vi.mocked(useAuth)

function makeMission(id: string, completed_at: string, price_eur = 0, distance_km = 0): Mission {
  return { id, completed_at, scheduled_at: completed_at, price_eur, distance_km } as unknown as Mission
}

/** Renvoie une date ISO dans les N derniers jours */
function daysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 3600 * 1000).toISOString()
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

// ─── Period ───────────────────────────────────────────────────────────────────
describe('useHistoryTab — period', () => {
  it('period initialement à "all"', async () => {
    const { result } = renderHook(() => useHistoryTab())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.period).toBe('all')
  })

  it('setPeriod("week") filtre les 7 derniers jours', async () => {
    mockGetDoneByDriver.mockResolvedValueOnce([
      makeMission('m-recent', daysAgo(3), 50),
      makeMission('m-old', daysAgo(15), 80),
    ])
    const { result } = renderHook(() => useHistoryTab())
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => result.current.setPeriod('week'))

    expect(result.current.filtered).toHaveLength(1)
    expect(result.current.filtered[0].id).toBe('m-recent')
  })

  it('setPeriod("month") filtre les 30 derniers jours', async () => {
    mockGetDoneByDriver.mockResolvedValueOnce([
      makeMission('m-recent', daysAgo(10), 30),
      makeMission('m-mid', daysAgo(25), 20),
      makeMission('m-old', daysAgo(40), 15),
    ])
    const { result } = renderHook(() => useHistoryTab())
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => result.current.setPeriod('month'))

    expect(result.current.filtered).toHaveLength(2)
  })

  it('period "all" conserve toutes les missions', async () => {
    mockGetDoneByDriver.mockResolvedValueOnce([
      makeMission('m1', daysAgo(3), 10),
      makeMission('m2', daysAgo(60), 20),
      makeMission('m3', daysAgo(200), 30),
    ])
    const { result } = renderHook(() => useHistoryTab())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.filtered).toHaveLength(3)
  })
})

// ─── Stats ────────────────────────────────────────────────────────────────────
describe('useHistoryTab — stats', () => {
  it('stats.total est la somme des price_eur filtrés', async () => {
    mockGetDoneByDriver.mockResolvedValueOnce([
      makeMission('m1', daysAgo(3), 40),
      makeMission('m2', daysAgo(3), 60),
      makeMission('m3', daysAgo(15), 100),
    ])
    const { result } = renderHook(() => useHistoryTab())
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => result.current.setPeriod('week'))
    expect(result.current.stats.total).toBe(100)
  })

  it('stats.count est le nombre de missions filtrées', async () => {
    mockGetDoneByDriver.mockResolvedValueOnce([
      makeMission('m1', daysAgo(2), 10),
      makeMission('m2', daysAgo(4), 20),
      makeMission('m3', daysAgo(20), 30),
    ])
    const { result } = renderHook(() => useHistoryTab())
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => result.current.setPeriod('week'))
    expect(result.current.stats.count).toBe(2)
  })

  it('stats.km est la somme des distance_km filtrés', async () => {
    mockGetDoneByDriver.mockResolvedValueOnce([
      makeMission('m1', daysAgo(1), 10, 12),
      makeMission('m2', daysAgo(5), 20, 8),
    ])
    const { result } = renderHook(() => useHistoryTab())
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => result.current.setPeriod('week'))
    expect(result.current.stats.km).toBe(20)
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

// ─── Navigation ───────────────────────────────────────────────────────────────
describe('useHistoryTab — openDetail', () => {
  it('appelle router.push avec la bonne URL', async () => {
    const { result } = renderHook(() => useHistoryTab())
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => result.current.openDetail('abc-123'))
    expect(mockPush).toHaveBeenCalledWith('/dashboard/chauffeur/mission/abc-123')
  })
})
