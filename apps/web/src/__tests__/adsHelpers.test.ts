import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getAdState, deriveTrackerStep, buildAdDays, type AdView } from '@/components/dashboard/driver/courses/ads/adsHelpers'
import type { Mission } from '@/lib/supabase/types'

const FROZEN = new Date('2026-05-02T10:00:00.000Z')

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(FROZEN)
})

afterEach(() => { vi.useRealTimers() })

function makeMission(extra: Partial<Mission> = {}): Mission {
  return {
    id: 'm1',
    scheduled_at: '2026-05-02T11:00:00.000Z',
    departure: 'A',
    destination: 'B',
    status: 'AVAILABLE',
    duration_min: 20,
    enroute_at: null,
    pickup_at: null,
    dropoff_at: null,
    completed_at: null,
    price_eur: 30,
    ...extra,
  } as unknown as Mission
}

describe('getAdState', () => {
  it("AVAILABLE → 'waiting'", () => {
    expect(getAdState(makeMission({ status: 'AVAILABLE' }))).toBe('waiting')
  })

  it("IN_PROGRESS → 'accepted'", () => {
    expect(getAdState(makeMission({ status: 'IN_PROGRESS' }))).toBe('accepted')
  })

  it("ACCEPTED → 'accepted'", () => {
    expect(getAdState(makeMission({ status: 'ACCEPTED' }))).toBe('accepted')
  })

  it("DONE → 'done'", () => {
    expect(getAdState(makeMission({ status: 'DONE' }))).toBe('done')
  })
})

describe('deriveTrackerStep', () => {
  const now = FROZEN.getTime()

  it("status='IN_PROGRESS' sans timestamp → 'accepted'", () => {
    expect(deriveTrackerStep(makeMission({ status: 'IN_PROGRESS' }), now)).toBe('accepted')
  })

  it("enroute_at posé, durée non écoulée → 'enroute'", () => {
    const enrouteAt = new Date(now - 5 * 60_000).toISOString() // 5 min avant
    const m = makeMission({ status: 'IN_PROGRESS', enroute_at: enrouteAt, duration_min: 20 })
    expect(deriveTrackerStep(m, now)).toBe('enroute')
  })

  it("enroute_at posé, durée écoulée → bascule sur 'onboard' auto-déduit", () => {
    const enrouteAt = new Date(now - 25 * 60_000).toISOString() // 25 min avant, durée 20 → écoulé
    const m = makeMission({ status: 'IN_PROGRESS', enroute_at: enrouteAt, duration_min: 20 })
    expect(deriveTrackerStep(m, now)).toBe('onboard')
  })

  it("pickup_at posé → 'onboard'", () => {
    const pickupAt = new Date(now - 5 * 60_000).toISOString()
    const m = makeMission({ status: 'IN_PROGRESS', pickup_at: pickupAt })
    expect(deriveTrackerStep(m, now)).toBe('onboard')
  })

  it("status='DONE' → 'done'", () => {
    expect(deriveTrackerStep(makeMission({ status: 'DONE' }), now)).toBe('done')
  })

  it("dropoff_at posé → 'done'", () => {
    const dropoffAt = new Date(now - 1 * 60_000).toISOString()
    const m = makeMission({ status: 'IN_PROGRESS', dropoff_at: dropoffAt })
    expect(deriveTrackerStep(m, now)).toBe('done')
  })
})

describe('buildAdDays', () => {
  function adView(id: string, scheduled_at: string, status: 'AVAILABLE' | 'IN_PROGRESS' | 'DONE' = 'AVAILABLE'): AdView {
    return {
      mission: makeMission({ id, scheduled_at, status }),
      state: getAdState(makeMission({ id, scheduled_at, status })),
      driver: null,
    }
  }

  it("ne retient que les jours qui ont des annonces", () => {
    const groups = buildAdDays([
      adView('a1', '2026-05-02T11:00:00.000Z'),
      adView('a2', '2026-05-04T09:00:00.000Z'),
    ])
    expect(groups).toHaveLength(2)
    expect(groups.map((g) => g.date.toDateString())).toEqual([
      new Date('2026-05-02').toDateString(),
      new Date('2026-05-04').toDateString(),
    ])
  })

  it("inclut les annonces des 3 derniers jours (effectuées récentes)", () => {
    const groups = buildAdDays([
      adView('a-yesterday', '2026-05-01T14:00:00.000Z', 'DONE'),
    ])
    expect(groups).toHaveLength(1)
    expect(groups[0].label.startsWith('Hier') || groups[0].label.includes('mai')).toBe(true)
  })

  it("le total agrège les prix de toutes les annonces du jour", () => {
    const groups = buildAdDays([
      { mission: makeMission({ id: '1', scheduled_at: '2026-05-02T09:00:00.000Z', price_eur: 30 }), state: 'waiting', driver: null },
      { mission: makeMission({ id: '2', scheduled_at: '2026-05-02T14:00:00.000Z', price_eur: 50 }), state: 'waiting', driver: null },
    ])
    expect(groups[0].total).toBe(80)
  })
})
