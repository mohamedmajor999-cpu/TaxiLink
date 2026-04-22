import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useUpcomingTab } from '@/components/dashboard/driver/courses/useUpcomingTab'
import type { Mission } from '@/lib/supabase/types'

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockGetAgenda = vi.fn()
const mockPush = vi.fn()

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/services/missionService', () => ({
  missionService: {
    getAgenda: (...a: unknown[]) => mockGetAgenda(...a),
  },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

import { useAuth } from '@/hooks/useAuth'
const mockUseAuth = vi.mocked(useAuth)

// Système figé au 2026-05-01 10:00 UTC (vendredi)
// today  = 2026-05-01 (vendredi)
// tomorrow = 2026-05-02 (samedi)
const FROZEN = new Date('2026-05-01T10:00:00.000Z')

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(FROZEN)
  vi.clearAllMocks()
  mockUseAuth.mockReturnValue({ user: { id: 'u1' }, loading: false } as ReturnType<typeof useAuth>)
  mockGetAgenda.mockResolvedValue([])
})

afterEach(() => {
  vi.useRealTimers()
})

function mission(id: string, scheduled_at: string, price_eur = 0): Mission {
  return { id, scheduled_at, price_eur } as unknown as Mission
}

// ─── Chargement ───────────────────────────────────────────────────────────────
describe('useUpcomingTab — chargement', () => {
  it('ne fait rien si user est null', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false } as ReturnType<typeof useAuth>)
    renderHook(() => useUpcomingTab())
    expect(mockGetAgenda).not.toHaveBeenCalled()
  })

  it('appelle missionService.getAgenda avec user.id', async () => {
    const { result } = renderHook(() => useUpcomingTab())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(mockGetAgenda).toHaveBeenCalledWith('u1')
  })

  it('met loading à false après chargement', async () => {
    const { result } = renderHook(() => useUpcomingTab())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBeNull()
  })

  it('met error si le service échoue', async () => {
    mockGetAgenda.mockRejectedValueOnce(new Error('réseau KO'))
    const { result } = renderHook(() => useUpcomingTab())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('réseau KO')
  })
})

// ─── Groupes par jour ─────────────────────────────────────────────────────────
describe('useUpcomingTab — groupes', () => {
  it('regroupe les missions par jour', async () => {
    mockGetAgenda.mockResolvedValueOnce([
      mission('m1', '2026-05-01T11:00:00.000Z', 30),
      mission('m2', '2026-05-01T14:00:00.000Z', 20),
      mission('m3', '2026-05-02T09:00:00.000Z', 50),
    ])
    const { result } = renderHook(() => useUpcomingTab())
    await waitFor(() => expect(result.current.groups).toHaveLength(2))
    expect(result.current.groups[0].missions).toHaveLength(2) // today
    expect(result.current.groups[1].missions).toHaveLength(1) // tomorrow
  })

  it('trie les missions dans chaque groupe par heure croissante', async () => {
    mockGetAgenda.mockResolvedValueOnce([
      mission('m2', '2026-05-01T14:00:00.000Z'),
      mission('m1', '2026-05-01T09:00:00.000Z'),
    ])
    const { result } = renderHook(() => useUpcomingTab())
    await waitFor(() => expect(result.current.groups).toHaveLength(1))
    expect(result.current.groups[0].missions[0].id).toBe('m1')
    expect(result.current.groups[0].missions[1].id).toBe('m2')
  })

  it("le label du groupe d'aujourd'hui commence par \"Aujourd'hui\"", async () => {
    mockGetAgenda.mockResolvedValueOnce([
      mission('m1', '2026-05-01T11:00:00.000Z'),
    ])
    const { result } = renderHook(() => useUpcomingTab())
    await waitFor(() => expect(result.current.groups).toHaveLength(1))
    expect(result.current.groups[0].label).toMatch(/^Aujourd'hui/)
  })

  it('le label du groupe de demain commence par "Demain"', async () => {
    mockGetAgenda.mockResolvedValueOnce([
      mission('m1', '2026-05-02T09:00:00.000Z'),
    ])
    const { result } = renderHook(() => useUpcomingTab())
    await waitFor(() => expect(result.current.groups).toHaveLength(1))
    expect(result.current.groups[0].label).toMatch(/^Demain/)
  })
})

// ─── Stats du jour / lendemain ────────────────────────────────────────────────
describe('useUpcomingTab — stats', () => {
  it('todayTotal et todayCount comptent les missions du jour', async () => {
    mockGetAgenda.mockResolvedValueOnce([
      mission('m1', '2026-05-01T09:00:00.000Z', 30),
      mission('m2', '2026-05-01T14:00:00.000Z', 20),
    ])
    const { result } = renderHook(() => useUpcomingTab())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.todayTotal).toBe(50)
    expect(result.current.todayCount).toBe(2)
  })

  it('tomorrowTotal et tomorrowCount comptent les missions du lendemain', async () => {
    mockGetAgenda.mockResolvedValueOnce([
      mission('m1', '2026-05-02T10:00:00.000Z', 45),
    ])
    const { result } = renderHook(() => useUpcomingTab())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.tomorrowTotal).toBe(45)
    expect(result.current.tomorrowCount).toBe(1)
  })

  it("todayTotal est 0 quand aucune mission aujourd'hui", async () => {
    mockGetAgenda.mockResolvedValueOnce([
      mission('m1', '2026-05-03T10:00:00.000Z', 60),
    ])
    const { result } = renderHook(() => useUpcomingTab())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.todayTotal).toBe(0)
    expect(result.current.todayCount).toBe(0)
  })
})

// ─── Prochaine mission ────────────────────────────────────────────────────────
describe('useUpcomingTab — next / nextInMinutes', () => {
  it('next est null quand aucune mission', async () => {
    const { result } = renderHook(() => useUpcomingTab())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.next).toBeUndefined()
    expect(result.current.nextInMinutes).toBeNull()
  })

  it('nextInMinutes calcule les minutes avant la prochaine mission', async () => {
    // Système figé à 10h00, mission à 11h00 → 60 minutes
    mockGetAgenda.mockResolvedValueOnce([
      mission('m1', '2026-05-01T11:00:00.000Z'),
    ])
    const { result } = renderHook(() => useUpcomingTab())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.nextInMinutes).toBe(60)
  })

  it('nextInMinutes est 0 pour une mission dans le passé (déjà commencée)', async () => {
    // Mission à 09h00, système à 10h00 → passée, filtrée par upcoming
    // upcoming filtre >= today (minuit), donc une mission du jour passée reste visible
    mockGetAgenda.mockResolvedValueOnce([
      mission('m1', '2026-05-01T09:00:00.000Z'),
    ])
    const { result } = renderHook(() => useUpcomingTab())
    await waitFor(() => expect(result.current.loading).toBe(false))
    // nextInMinutes = max(Math.round(-60), 0) = 0
    expect(result.current.nextInMinutes).toBe(0)
  })
})

// ─── openDetails ──────────────────────────────────────────────────────────────
describe('useUpcomingTab — navigation vers détail', () => {
  it('openDetails appelle router.push avec le bon chemin', async () => {
    const m = mission('m1', '2026-05-01T11:00:00.000Z')
    mockGetAgenda.mockResolvedValueOnce([m])
    const { result } = renderHook(() => useUpcomingTab())
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => { result.current.openDetails('m1') })
    expect(mockPush).toHaveBeenCalledWith('/dashboard/chauffeur/mission/m1')
  })

  it('openDetails construit le chemin avec un id différent', async () => {
    mockGetAgenda.mockResolvedValueOnce([])
    const { result } = renderHook(() => useUpcomingTab())
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => { result.current.openDetails('abc-123') })
    expect(mockPush).toHaveBeenCalledWith('/dashboard/chauffeur/mission/abc-123')
  })
})
