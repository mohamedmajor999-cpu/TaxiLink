import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useNextMissionBanner } from '@/components/dashboard/driver/useNextMissionBanner'
import type { Mission } from '@/lib/supabase/types'

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockComputeDisplayFare = vi.fn()
const mockComputeRoute = vi.fn()

vi.mock('@/lib/missionFare', () => ({
  computeDisplayFare: (...a: unknown[]) => mockComputeDisplayFare(...a),
}))

vi.mock('@/services/addressService', () => ({
  computeRoute: (...a: unknown[]) => mockComputeRoute(...a),
  computeRouteGoogle: vi.fn().mockResolvedValue(null),
}))

const FROZEN = new Date('2026-05-01T10:00:00.000Z')

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(FROZEN)
  vi.clearAllMocks()
  mockComputeDisplayFare.mockReturnValue({ value: 42, isEstimated: false, min: null, max: null })
  mockComputeRoute.mockResolvedValue({ duration_min: 8, distance_km: 5, geometry: null })
})

afterEach(() => {
  vi.useRealTimers()
})

function makeMission(scheduledAt: string, opts: Partial<Mission> = {}): Mission {
  return {
    id: 'm1', type: 'CPAM',
    scheduled_at: scheduledAt,
    departure: 'Paris', destination: 'Lyon',
    departure_lat: 48.85, departure_lng: 2.35,
    ...opts,
  } as unknown as Mission
}

// ─── isStarted ────────────────────────────────────────────────────────────────
describe('useNextMissionBanner — isStarted', () => {
  it('isStarted=false pour mission dans le futur', () => {
    const { result } = renderHook(() =>
      useNextMissionBanner({ mission: makeMission('2026-05-01T11:00:00.000Z') }),
    )
    expect(result.current.isStarted).toBe(false)
  })

  it('isStarted=true pour mission dans le passé', () => {
    const { result } = renderHook(() =>
      useNextMissionBanner({ mission: makeMission('2026-05-01T09:00:00.000Z') }),
    )
    expect(result.current.isStarted).toBe(true)
  })

  it("countdown='Départ maintenant' quand isStarted=true", () => {
    const { result } = renderHook(() =>
      useNextMissionBanner({ mission: makeMission('2026-05-01T09:00:00.000Z') }),
    )
    expect(result.current.countdown).toBe('Départ maintenant')
  })
})

// ─── fare et badge ────────────────────────────────────────────────────────────
describe('useNextMissionBanner — fare et badge', () => {
  it('fare provient de computeDisplayFare', () => {
    const { result } = renderHook(() =>
      useNextMissionBanner({ mission: makeMission('2026-05-01T11:00:00.000Z') }),
    )
    expect(result.current.fare).toEqual({ value: 42, isEstimated: false, min: null, max: null })
    expect(mockComputeDisplayFare).toHaveBeenCalledTimes(1)
  })

  it("badge CPAM → variant='medical' label='Médical'", () => {
    const { result } = renderHook(() =>
      useNextMissionBanner({ mission: makeMission('2026-05-01T11:00:00.000Z', { type: 'CPAM' }) }),
    )
    expect(result.current.badge).toEqual({ variant: 'medical', label: 'Médical' })
  })

  it("badge PRIVE → variant='private'", () => {
    const { result } = renderHook(() =>
      useNextMissionBanner({ mission: makeMission('2026-05-01T11:00:00.000Z', { type: 'PRIVE' }) }),
    )
    expect(result.current.badge.variant).toBe('private')
  })
})

// ─── ETA (computeRoute) ───────────────────────────────────────────────────────
describe('useNextMissionBanner — ETA', () => {
  it('appelle computeRoute si userCoords est fourni', async () => {
    const userCoords = { lat: 43.3, lng: 5.4 }
    const { result } = renderHook(() =>
      useNextMissionBanner({
        mission: makeMission('2026-05-01T11:00:00.000Z'),
        userCoords,
      }),
    )
    // Flush pending microtasks (computeRoute is a resolved Promise)
    await act(async () => { await Promise.resolve() })
    expect(mockComputeRoute).toHaveBeenCalledTimes(1)
    expect(result.current.etaText).toContain('depuis votre position')
  })

  it('etaText est null si userCoords est absent', () => {
    const { result } = renderHook(() =>
      useNextMissionBanner({ mission: makeMission('2026-05-01T11:00:00.000Z') }),
    )
    expect(result.current.etaText).toBeNull()
  })
})

// ─── handleComplete ───────────────────────────────────────────────────────────
describe('useNextMissionBanner — handleComplete', () => {
  it('showComplete=false si mission pas encore commencée', () => {
    const { result } = renderHook(() =>
      useNextMissionBanner({
        mission: makeMission('2026-05-01T11:00:00.000Z'),
        onComplete: vi.fn(),
      }),
    )
    expect(result.current.showComplete).toBe(false)
  })

  it('handleComplete appelle onComplete avec mission.id', async () => {
    const onComplete = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() =>
      useNextMissionBanner({
        mission: makeMission('2026-05-01T09:00:00.000Z'),
        onComplete,
      }),
    )
    await act(async () => { await result.current.handleComplete() })
    expect(onComplete).toHaveBeenCalledWith('m1')
    expect(result.current.completing).toBe(false)
  })
})
