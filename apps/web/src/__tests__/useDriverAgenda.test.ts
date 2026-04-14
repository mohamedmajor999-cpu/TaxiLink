import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useDriverAgenda } from '@/components/dashboard/driver/useDriverAgenda'

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockGetAgenda = vi.fn()

// Référence stable — évite la boucle infinie causée par useEffect([user])
const mockUser = { id: 'u1' }

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser }),
}))

vi.mock('@/services/missionService', () => ({
  missionService: {
    getAgenda: (...a: unknown[]) => mockGetAgenda(...a),
  },
}))

vi.mock('@/lib/utils', () => ({
  isSameDay: (a: Date, b: Date) => a.toDateString() === b.toDateString(),
}))

const today = new Date()
const fakeMission = {
  id: 'm1',
  scheduled_at: today.toISOString(),
  distance_km:  10,
  price_eur:    25,
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetAgenda.mockResolvedValue([fakeMission])
})

// ─── Chargement ───────────────────────────────────────────────────────────────
describe('useDriverAgenda — chargement', () => {
  it('charge les missions et expose les stats du jour selectionne', async () => {
    const { result } = renderHook(() => useDriverAgenda())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.current).toHaveLength(1)
    expect(result.current.stats.rides).toBe(1)
    expect(result.current.stats.km).toBe(10)
    expect(result.current.stats.earnings).toBe(25)
  })
})

// ─── Navigation ───────────────────────────────────────────────────────────────
describe('useDriverAgenda — navigation', () => {
  it('hasMissions retourne true pour le jour avec mission', async () => {
    const { result } = renderHook(() => useDriverAgenda())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.hasMissions(today)).toBe(true)
  })

  it('onNext avance la selection de 7 jours', async () => {
    const { result } = renderHook(() => useDriverAgenda())
    await waitFor(() => expect(result.current.loading).toBe(false))
    const before = result.current.selected.getTime()
    act(() => { result.current.onNext() })
    expect(result.current.selected.getTime()).toBeGreaterThan(before)
  })

  it('onPrev recule la selection de 7 jours', async () => {
    const { result } = renderHook(() => useDriverAgenda())
    await waitFor(() => expect(result.current.loading).toBe(false))
    const before = result.current.selected.getTime()
    act(() => { result.current.onPrev() })
    expect(result.current.selected.getTime()).toBeLessThan(before)
  })
})
