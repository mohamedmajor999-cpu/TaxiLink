import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useTodayTab } from '@/components/dashboard/driver/courses/today/useTodayTab'
import { useDriverAgendaStore } from '@/store/driverAgendaStore'
import type { Mission } from '@/lib/supabase/types'

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }))

const FROZEN = new Date('2026-05-02T10:00:00.000Z')

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(FROZEN)
  vi.clearAllMocks()
  useDriverAgendaStore.setState({
    missions: [],
    isLoading: false,
    loadedFor: 'u1',
    error: null,
  })
})

afterEach(() => { vi.useRealTimers() })

function seed(missions: Mission[]) {
  useDriverAgendaStore.setState({ missions, loadedFor: 'u1', isLoading: false, error: null })
}

function mission(
  id: string,
  scheduled_at: string,
  price_eur = 0,
  status: 'AVAILABLE' | 'IN_PROGRESS' | 'DONE' = 'AVAILABLE',
  extra: Partial<Mission> = {},
): Mission {
  return { id, scheduled_at, price_eur, status, distance_km: null, duration_min: null, no_show: false, enroute_at: null, pickup_at: null, ...extra } as unknown as Mission
}

describe('useTodayTab — séparation next / restOfDay', () => {
  it('next = première course du jour, restOfDay = les autres', () => {
    seed([
      mission('m1', '2026-05-02T11:00:00.000Z', 30),
      mission('m2', '2026-05-02T14:00:00.000Z', 20),
      mission('m3', '2026-05-02T16:00:00.000Z', 50),
    ])
    const { result } = renderHook(() => useTodayTab())
    expect(result.current.next?.id).toBe('m1')
    expect(result.current.restOfDay.map((m) => m.id)).toEqual(['m2', 'm3'])
  })

  it('current = IN_PROGRESS avec enroute_at posé ; les autres restent listées', () => {
    seed([
      mission('mC', '2026-05-02T09:00:00.000Z', 25, 'IN_PROGRESS', { enroute_at: '2026-05-02T08:55:00.000Z' }),
      mission('m1', '2026-05-02T11:00:00.000Z', 30),
    ])
    const { result } = renderHook(() => useTodayTab())
    expect(result.current.current?.id).toBe('mC')
    expect(result.current.next?.id).toBe('m1')
    expect(result.current.restOfDay).toHaveLength(0)
  })

  it('IN_PROGRESS sans enroute_at ni pickup_at reste dans upcomingToday (acceptée mais pas démarrée)', () => {
    seed([
      mission('mAccepted', '2026-05-02T20:00:00.000Z', 50, 'IN_PROGRESS'),
      mission('m1', '2026-05-02T11:00:00.000Z', 30),
    ])
    const { result } = renderHook(() => useTodayTab())
    expect(result.current.current).toBeNull()
    expect(result.current.next?.id).toBe('m1')
    expect(result.current.restOfDay.map((m) => m.id)).toEqual(['mAccepted'])
  })

  it("plusieurs IN_PROGRESS aujourd'hui : la course active (enroute_at) est current, les autres restent listées", () => {
    seed([
      mission('mActive', '2026-05-02T09:00:00.000Z', 25, 'IN_PROGRESS', { enroute_at: '2026-05-02T08:55:00.000Z' }),
      mission('mLater', '2026-05-02T20:30:00.000Z', 58, 'IN_PROGRESS'),
      mission('m1', '2026-05-02T15:00:00.000Z', 30),
    ])
    const { result } = renderHook(() => useTodayTab())
    expect(result.current.current?.id).toBe('mActive')
    expect(result.current.next?.id).toBe('m1')
    expect(result.current.restOfDay.map((m) => m.id)).toEqual(['mLater'])
  })

  it("exclut les missions des jours suivants", () => {
    seed([
      mission('m1', '2026-05-02T11:00:00.000Z', 30),
      mission('mTomorrow', '2026-05-03T11:00:00.000Z', 30),
    ])
    const { result } = renderHook(() => useTodayTab())
    expect(result.current.todayCount).toBe(1)
    expect(result.current.next?.id).toBe('m1')
  })

  it('todayTotal = somme des prix des courses du jour', () => {
    seed([
      mission('m1', '2026-05-02T11:00:00.000Z', 30),
      mission('m2', '2026-05-02T14:00:00.000Z', 20),
    ])
    const { result } = renderHook(() => useTodayTab())
    expect(result.current.todayTotal).toBe(50)
  })
})

describe('useTodayTab — états', () => {
  it('error remonté depuis le store', () => {
    useDriverAgendaStore.setState({ missions: [], loadedFor: null, isLoading: false, error: 'réseau KO' })
    const { result } = renderHook(() => useTodayTab())
    expect(result.current.error).toBe('réseau KO')
  })

  it('vide si aucune mission', () => {
    const { result } = renderHook(() => useTodayTab())
    expect(result.current.current).toBeNull()
    expect(result.current.next).toBeNull()
    expect(result.current.restOfDay).toHaveLength(0)
  })

  it('loading=true tant que le store n\'a pas été chargé pour ce driver', () => {
    useDriverAgendaStore.setState({ missions: [], loadedFor: null, isLoading: true, error: null })
    const { result } = renderHook(() => useTodayTab())
    expect(result.current.loading).toBe(true)
  })
})
