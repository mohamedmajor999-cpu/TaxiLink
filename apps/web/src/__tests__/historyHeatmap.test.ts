import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { buildHeatmap } from '@/lib/historyHeatmap'
import type { Mission } from '@/lib/supabase/types'

function m(date: string, price = 0): Mission {
  return {
    id: `m-${date}-${price}`,
    completed_at: date,
    scheduled_at: date,
    price_eur: price,
  } as unknown as Mission
}

const NOW = new Date('2026-05-01T12:00:00.000Z')

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
})
afterEach(() => { vi.useRealTimers() })

describe('buildHeatmap', () => {
  it('produit `days` cellules consécutives finissant aujourd\'hui', () => {
    const cells = buildHeatmap([], 30, NOW)
    expect(cells).toHaveLength(30)
    expect(cells[cells.length - 1].date).toBe('2026-05-01')
    expect(cells[0].date).toBe('2026-04-02')
  })

  it('aggrege count et total par jour', () => {
    const cells = buildHeatmap([
      m('2026-04-30T10:00:00Z', 30),
      m('2026-04-30T14:00:00Z', 50),
      m('2026-04-29T09:00:00Z', 20),
    ], 7, NOW)
    const apr30 = cells.find((c) => c.date === '2026-04-30')!
    const apr29 = cells.find((c) => c.date === '2026-04-29')!
    expect(apr30.count).toBe(2)
    expect(apr30.total).toBe(80)
    expect(apr29.count).toBe(1)
    expect(apr29.total).toBe(20)
  })

  it('intensity=0 quand aucune course', () => {
    const cells = buildHeatmap([], 7, NOW)
    expect(cells.every((c) => c.intensity === 0)).toBe(true)
  })

  it('intensity normalisée 1..4 selon la fraction du max', () => {
    // 3 jours: 1, 2, 4 courses → max=4. Intensites: 1/4=0.25→1, 2/4=0.5→2, 4/4=1→4
    const cells = buildHeatmap([
      m('2026-04-28T10:00:00Z'),
      m('2026-04-29T10:00:00Z'), m('2026-04-29T11:00:00Z'),
      m('2026-04-30T10:00:00Z'), m('2026-04-30T11:00:00Z'),
      m('2026-04-30T12:00:00Z'), m('2026-04-30T13:00:00Z'),
    ], 7, NOW)
    expect(cells.find((c) => c.date === '2026-04-28')!.intensity).toBe(1)
    expect(cells.find((c) => c.date === '2026-04-29')!.intensity).toBe(2)
    expect(cells.find((c) => c.date === '2026-04-30')!.intensity).toBe(4)
  })

  it('utilise scheduled_at si completed_at est null', () => {
    const cells = buildHeatmap([
      { id: 'x', completed_at: null, scheduled_at: '2026-04-30T10:00:00Z', price_eur: 0 } as unknown as Mission,
    ], 7, NOW)
    expect(cells.find((c) => c.date === '2026-04-30')!.count).toBe(1)
  })
})
