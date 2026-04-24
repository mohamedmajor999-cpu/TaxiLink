import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDriverHomeFilters } from '@/components/dashboard/driver/home/useDriverHomeFilters'
import type { Mission } from '@/lib/supabase/types'
import type { Group } from '@taxilink/core'

vi.mock('@/components/dashboard/driver/home/missionVisibility', () => ({
  isPublicMission: (m: Mission) => !(m as unknown as { group_ids: string[] }).group_ids?.length,
  extractMissionGroupIds: (m: Mission) => (m as unknown as { group_ids: string[] }).group_ids ?? [],
  toCourseCard: (m: Mission) => ({ id: m.id, mission: m }),
}))

vi.mock('@/lib/missionFare', () => ({
  computeDisplayFare: (m: Mission) => ({ value: Number((m as unknown as { price_eur: number }).price_eur ?? 0) }),
}))

vi.mock('@/lib/geoDistance', () => ({
  haversineKm: () => 10,
}))

const NOW = new Date('2026-05-01T10:00:00.000Z')

function makeMission(id: string, scheduledAt: string, opts: Partial<Record<string, unknown>> = {}): Mission {
  return { id, scheduled_at: scheduledAt, type: 'PRIVE', created_at: NOW.toISOString(), ...opts } as unknown as Mission
}

const FUTURE = '2026-05-01T12:00:00.000Z'
// Passé au-delà de la tolérance 24h (cf. PAST_TOLERANCE_MS) — mission vraiment périmée.
const PAST   = '2026-04-29T10:00:00.000Z'

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})
afterEach(() => {
  vi.useRealTimers()
})

describe('useDriverHomeFilters', () => {
  it('filtre les missions passées', () => {
    const missions = [makeMission('m1', FUTURE), makeMission('m2', PAST)]
    const { result } = renderHook(() => useDriverHomeFilters({ missions, groups: [], userCoords: null }))
    expect(result.current.cards).toHaveLength(1)
    expect(result.current.cards[0].id).toBe('m1')
  })

  it('filter CPAM ne garde que les missions CPAM', () => {
    const missions = [
      makeMission('m1', FUTURE, { type: 'CPAM' }),
      makeMission('m2', FUTURE, { type: 'PRIVE' }),
    ]
    const { result } = renderHook(() => useDriverHomeFilters({ missions, groups: [], userCoords: null }))
    act(() => { result.current.setFilter('CPAM') })
    expect(result.current.cards).toHaveLength(1)
    expect(result.current.cards[0].id).toBe('m1')
  })

  it('counts.ALL inclut toutes les missions futures', () => {
    const missions = [makeMission('m1', FUTURE), makeMission('m2', FUTURE), makeMission('m3', PAST)]
    const { result } = renderHook(() => useDriverHomeFilters({ missions, groups: [], userCoords: null }))
    expect(result.current.counts.ALL).toBe(2)
  })

  it('counts.CPAM compte correctement', () => {
    const missions = [
      makeMission('m1', FUTURE, { type: 'CPAM' }),
      makeMission('m2', FUTURE, { type: 'PRIVE' }),
    ]
    const { result } = renderHook(() => useDriverHomeFilters({ missions, groups: [], userCoords: null }))
    expect(result.current.counts.CPAM).toBe(1)
    expect(result.current.counts.PRIVE).toBe(1)
  })

  it("scopeLabel = 'tous mes groupes' sans groupe sélectionné", () => {
    const { result } = renderHook(() => useDriverHomeFilters({ missions: [], groups: [], userCoords: null }))
    expect(result.current.scopeLabel).toBe('tous mes groupes')
  })

  it("scopeLabel = 'missions publiques' pour HOME_GROUP_PUBLIC", () => {
    const { result } = renderHook(() => useDriverHomeFilters({ missions: [], groups: [], userCoords: null }))
    act(() => { result.current.setSelectedGroupId('__public__') })
    expect(result.current.scopeLabel).toBe('missions publiques')
  })

  it("scopeLabel = nom du groupe si groupe sélectionné", () => {
    const groups: Group[] = [{ id: 'g1', name: 'Équipe A', createdBy: 'u1' } as Group]
    const { result } = renderHook(() => useDriverHomeFilters({ missions: [], groups, userCoords: null }))
    act(() => { result.current.setSelectedGroupId('g1') })
    expect(result.current.scopeLabel).toBe('Équipe A')
  })

  it('setSort change le sort actif', () => {
    const { result } = renderHook(() => useDriverHomeFilters({ missions: [], groups: [], userCoords: null }))
    act(() => { result.current.setSort('newest') })
    expect(result.current.sort).toBe('newest')
  })
})
