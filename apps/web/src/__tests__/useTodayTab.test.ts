import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useTodayTab } from '@/components/dashboard/driver/courses/today/useTodayTab'
import type { Mission } from '@/lib/supabase/types'

const mockGetAgenda = vi.fn()
const mockPush = vi.fn()

vi.mock('@/hooks/useAuth', () => ({ useAuth: vi.fn() }))
vi.mock('@/services/missionService', () => ({
  missionService: { getAgenda: (...a: unknown[]) => mockGetAgenda(...a) },
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }))

import { useAuth } from '@/hooks/useAuth'
const mockUseAuth = vi.mocked(useAuth)

const FROZEN = new Date('2026-05-02T10:00:00.000Z')

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(FROZEN)
  vi.clearAllMocks()
  mockUseAuth.mockReturnValue({ user: { id: 'u1' }, loading: false } as ReturnType<typeof useAuth>)
  mockGetAgenda.mockResolvedValue([])
})

afterEach(() => { vi.useRealTimers() })

function mission(id: string, scheduled_at: string, price_eur = 0, status: 'AVAILABLE' | 'IN_PROGRESS' | 'DONE' = 'AVAILABLE'): Mission {
  return { id, scheduled_at, price_eur, status, distance_km: null, duration_min: null, no_show: false } as unknown as Mission
}

describe('useTodayTab — séparation next / restOfDay', () => {
  it('next = première course du jour, restOfDay = les autres', async () => {
    mockGetAgenda.mockResolvedValueOnce([
      mission('m1', '2026-05-02T11:00:00.000Z', 30),
      mission('m2', '2026-05-02T14:00:00.000Z', 20),
      mission('m3', '2026-05-02T16:00:00.000Z', 50),
    ])
    const { result } = renderHook(() => useTodayTab())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.next?.id).toBe('m1')
    expect(result.current.restOfDay.map((m) => m.id)).toEqual(['m2', 'm3'])
  })

  it('exclut les missions IN_PROGRESS du next/restOfDay (vont dans current)', async () => {
    mockGetAgenda.mockResolvedValueOnce([
      mission('mC', '2026-05-02T09:00:00.000Z', 25, 'IN_PROGRESS'),
      mission('m1', '2026-05-02T11:00:00.000Z', 30),
    ])
    const { result } = renderHook(() => useTodayTab())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.current?.id).toBe('mC')
    expect(result.current.next?.id).toBe('m1')
    expect(result.current.restOfDay).toHaveLength(0)
  })

  it("exclut les missions des jours suivants", async () => {
    mockGetAgenda.mockResolvedValueOnce([
      mission('m1', '2026-05-02T11:00:00.000Z', 30),
      mission('mTomorrow', '2026-05-03T11:00:00.000Z', 30),
    ])
    const { result } = renderHook(() => useTodayTab())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.todayCount).toBe(1)
    expect(result.current.next?.id).toBe('m1')
  })

  it('todayTotal = somme des prix des courses du jour', async () => {
    mockGetAgenda.mockResolvedValueOnce([
      mission('m1', '2026-05-02T11:00:00.000Z', 30),
      mission('m2', '2026-05-02T14:00:00.000Z', 20),
    ])
    const { result } = renderHook(() => useTodayTab())
    await waitFor(() => expect(result.current.todayTotal).toBe(50))
  })
})

describe('useTodayTab — états', () => {
  it('error si le service échoue', async () => {
    mockGetAgenda.mockRejectedValueOnce(new Error('réseau KO'))
    const { result } = renderHook(() => useTodayTab())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('réseau KO')
  })

  it('vide si aucune mission', async () => {
    const { result } = renderHook(() => useTodayTab())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.current).toBeNull()
    expect(result.current.next).toBeNull()
    expect(result.current.restOfDay).toHaveLength(0)
  })
})
