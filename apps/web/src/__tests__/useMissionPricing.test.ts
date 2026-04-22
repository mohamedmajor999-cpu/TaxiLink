import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useMissionPricing } from '@/components/dashboard/driver/useMissionPricing'

// ─── Mock ─────────────────────────────────────────────────────────────────────
const mockComputeEffectivePrice = vi.fn()

vi.mock('@/components/dashboard/driver/computeEffectivePrice', () => ({
  computeEffectivePrice: (...a: unknown[]) => mockComputeEffectivePrice(...a),
}))

function baseParams() {
  return {
    price: '', priceMin: '', priceMax: '',
    type: 'PRIVE' as const, medicalMotif: null,
    distanceKm: null, durationMin: null,
    date: '', time: '', departure: '', destination: '',
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockComputeEffectivePrice.mockReturnValue(null)
})

// ─── previewFare — prix saisi manuellement ────────────────────────────────────
describe('useMissionPricing — previewFare avec prix manuel', () => {
  it('price typé manuellement → previewFare.value sans estimation', () => {
    const { result } = renderHook(() =>
      useMissionPricing({ ...baseParams(), price: '42' }),
    )
    expect(result.current.previewFare).toEqual({
      value: 42, isEstimated: false, min: null, max: null,
    })
  })

  it('price avec virgule décimale → converti correctement', () => {
    const { result } = renderHook(() =>
      useMissionPricing({ ...baseParams(), price: '35,50' }),
    )
    expect(result.current.previewFare.value).toBeCloseTo(35.5)
    expect(result.current.previewFare.isEstimated).toBe(false)
  })
})

// ─── previewFare — effectivePrice fixed ──────────────────────────────────────
describe('useMissionPricing — previewFare avec effectivePrice fixed', () => {
  it('effectivePrice.kind=fixed et value>0 → isEstimated=true', () => {
    mockComputeEffectivePrice.mockReturnValue({ kind: 'fixed', value: 55 })
    const { result } = renderHook(() => useMissionPricing(baseParams()))
    expect(result.current.previewFare).toEqual({
      value: 55, isEstimated: true, min: null, max: null,
    })
  })

  it('effectivePrice.kind=fixed et value=0 → isEstimated=false', () => {
    mockComputeEffectivePrice.mockReturnValue({ kind: 'fixed', value: 0 })
    const { result } = renderHook(() => useMissionPricing(baseParams()))
    expect(result.current.previewFare.isEstimated).toBe(false)
  })
})

// ─── previewFare — effectivePrice range ──────────────────────────────────────
describe('useMissionPricing — previewFare avec effectivePrice range', () => {
  it('effectivePrice.kind=range → value = mid, min/max exposés', () => {
    mockComputeEffectivePrice.mockReturnValue({ kind: 'range', min: 30, max: 50 })
    const { result } = renderHook(() => useMissionPricing(baseParams()))
    expect(result.current.previewFare.value).toBe(40)
    expect(result.current.previewFare.min).toBe(30)
    expect(result.current.previewFare.max).toBe(50)
  })

  it('range avec priceMin+priceMax saisis → isEstimated=false', () => {
    mockComputeEffectivePrice.mockReturnValue({ kind: 'range', min: 30, max: 50 })
    const { result } = renderHook(() =>
      useMissionPricing({ ...baseParams(), priceMin: '30', priceMax: '50' }),
    )
    expect(result.current.previewFare.isEstimated).toBe(false)
  })

  it('range sans priceMin/priceMax saisis → isEstimated=true', () => {
    mockComputeEffectivePrice.mockReturnValue({ kind: 'range', min: 30, max: 50 })
    const { result } = renderHook(() => useMissionPricing(baseParams()))
    expect(result.current.previewFare.isEstimated).toBe(true)
  })
})

// ─── previewFare — sans effective ────────────────────────────────────────────
describe('useMissionPricing — previewFare sans effectivePrice', () => {
  it('retourne value=0 isEstimated=false quand effectivePrice est null', () => {
    const { result } = renderHook(() => useMissionPricing(baseParams()))
    expect(result.current.previewFare).toEqual({
      value: 0, isEstimated: false, min: null, max: null,
    })
  })

  it('expose effectivePrice depuis computeEffectivePrice', () => {
    const ep = { kind: 'fixed' as const, value: 30 }
    mockComputeEffectivePrice.mockReturnValue(ep)
    const { result } = renderHook(() => useMissionPricing(baseParams()))
    expect(result.current.effectivePrice).toBe(ep)
  })
})
