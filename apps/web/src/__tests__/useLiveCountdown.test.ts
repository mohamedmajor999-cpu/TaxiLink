import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLiveCountdown } from '@/components/ui/useLiveCountdown'

beforeEach(() => { vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers() })

describe('useLiveCountdown — état initial', () => {
  it('totalSeconds vaut 30', () => {
    const scheduledAt = new Date(Date.now() + 15000).toISOString()
    const { result } = renderHook(() => useLiveCountdown(scheduledAt))
    expect(result.current.totalSeconds).toBe(30)
  })

  it('remaining ≈ 15 pour une date dans 15s', () => {
    const scheduledAt = new Date(Date.now() + 15000).toISOString()
    const { result } = renderHook(() => useLiveCountdown(scheduledAt))
    expect(result.current.remaining).toBe(15)
  })

  it('remaining vaut 0 pour une date passée', () => {
    const scheduledAt = new Date(Date.now() - 5000).toISOString()
    const { result } = renderHook(() => useLiveCountdown(scheduledAt))
    expect(result.current.remaining).toBe(0)
  })

  it('remaining est plafonné à 30 même si date très lointaine', () => {
    const scheduledAt = new Date(Date.now() + 120000).toISOString()
    const { result } = renderHook(() => useLiveCountdown(scheduledAt))
    expect(result.current.remaining).toBe(30)
  })
})

describe('useLiveCountdown — décompte', () => {
  it('décrémente remaining après 1 seconde', () => {
    const scheduledAt = new Date(Date.now() + 10000).toISOString()
    const { result } = renderHook(() => useLiveCountdown(scheduledAt))
    expect(result.current.remaining).toBe(10)
    act(() => { vi.advanceTimersByTime(1000) })
    expect(result.current.remaining).toBe(9)
  })

  it('appelle onExpire quand remaining atteint 0', () => {
    const onExpire = vi.fn()
    const scheduledAt = new Date(Date.now() + 1000).toISOString()
    renderHook(() => useLiveCountdown(scheduledAt, onExpire))
    act(() => { vi.advanceTimersByTime(2000) })
    expect(onExpire).toHaveBeenCalled()
  })

  it('ne plante pas sans onExpire quand remaining atteint 0', () => {
    const scheduledAt = new Date(Date.now() + 500).toISOString()
    const { result } = renderHook(() => useLiveCountdown(scheduledAt))
    expect(() => {
      act(() => { vi.advanceTimersByTime(2000) })
    }).not.toThrow()
    expect(result.current.remaining).toBe(0)
  })
})
