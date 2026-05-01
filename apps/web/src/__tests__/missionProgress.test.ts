import { describe, it, expect } from 'vitest'
import { getMissionProgress, PROGRESS_LABELS } from '@/lib/missionProgress'
import type { Mission } from '@/lib/supabase/types'

function m(overrides: Partial<Mission>): Mission {
  return {
    id: 'm1',
    status: 'IN_PROGRESS',
    no_show: false,
    enroute_at: null,
    pickup_at: null,
    dropoff_at: null,
    ...overrides,
  } as unknown as Mission
}

describe('getMissionProgress', () => {
  it("retourne 'available' pour une course AVAILABLE", () => {
    expect(getMissionProgress(m({ status: 'AVAILABLE' }))).toBe('available')
  })

  it("retourne 'done' pour une course DONE", () => {
    expect(getMissionProgress(m({ status: 'DONE' }))).toBe('done')
  })

  it("retourne 'no_show' quand no_show=true (prioritaire sur done)", () => {
    expect(getMissionProgress(m({ status: 'DONE', no_show: true }))).toBe('no_show')
  })

  it("retourne 'accepted' pour une course IN_PROGRESS sans aucun timestamp", () => {
    expect(getMissionProgress(m({}))).toBe('accepted')
  })

  it("retourne 'enroute' quand seul enroute_at est rempli", () => {
    expect(getMissionProgress(m({ enroute_at: '2026-05-01T10:00:00Z' }))).toBe('enroute')
  })

  it("retourne 'onboard' quand pickup_at est rempli (priorité sur enroute)", () => {
    expect(
      getMissionProgress(m({
        enroute_at: '2026-05-01T10:00:00Z',
        pickup_at: '2026-05-01T10:10:00Z',
      })),
    ).toBe('onboard')
  })

  it("retourne 'dropped' quand dropoff_at est rempli mais status IN_PROGRESS", () => {
    expect(
      getMissionProgress(m({
        enroute_at: '2026-05-01T10:00:00Z',
        pickup_at: '2026-05-01T10:10:00Z',
        dropoff_at: '2026-05-01T10:30:00Z',
      })),
    ).toBe('dropped')
  })

  it('PROGRESS_LABELS couvre toutes les étapes', () => {
    const steps = ['available', 'accepted', 'enroute', 'onboard', 'dropped', 'done', 'no_show', 'cancelled'] as const
    for (const s of steps) {
      expect(PROGRESS_LABELS[s]).toBeTruthy()
    }
  })
})
