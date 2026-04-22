import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useHoldAcceptButton } from '@/components/taxilink/useHoldAcceptButton'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useHoldAcceptButton — états', () => {
  it('état initial est idle', () => {
    const { result } = renderHook(() => useHoldAcceptButton({ onConfirm: vi.fn() }))
    expect(result.current.state).toBe('idle')
  })

  it('start passe en pressing', () => {
    const { result } = renderHook(() => useHoldAcceptButton({ onConfirm: vi.fn() }))
    act(() => { result.current.start() })
    expect(result.current.state).toBe('pressing')
  })

  it('après la durée, passe en confirmed', () => {
    const { result } = renderHook(() => useHoldAcceptButton({ onConfirm: vi.fn(), duration: 1000 }))
    act(() => { result.current.start() })
    act(() => { vi.advanceTimersByTime(1000) })
    expect(result.current.state).toBe('confirmed')
  })

  it('appelle onConfirm 600ms après confirmed', () => {
    const onConfirm = vi.fn()
    const { result } = renderHook(() => useHoldAcceptButton({ onConfirm, duration: 1000 }))
    act(() => { result.current.start() })
    act(() => { vi.advanceTimersByTime(1000) })
    expect(onConfirm).not.toHaveBeenCalled()
    act(() => { vi.advanceTimersByTime(600) })
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('cancel pendant pressing revient à idle et annule le timer', () => {
    const onConfirm = vi.fn()
    const { result } = renderHook(() => useHoldAcceptButton({ onConfirm, duration: 1000 }))
    act(() => { result.current.start() })
    act(() => { result.current.cancel() })
    expect(result.current.state).toBe('idle')
    act(() => { vi.advanceTimersByTime(2000) })
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('cancel en confirmed ne fait rien', () => {
    const { result } = renderHook(() => useHoldAcceptButton({ onConfirm: vi.fn(), duration: 1000 }))
    act(() => { result.current.start() })
    act(() => { vi.advanceTimersByTime(1000) })
    act(() => { result.current.cancel() })
    expect(result.current.state).toBe('confirmed')
  })

  it('disabled=true empêche start', () => {
    const { result } = renderHook(() => useHoldAcceptButton({ onConfirm: vi.fn(), disabled: true }))
    act(() => { result.current.start() })
    expect(result.current.state).toBe('idle')
  })

  it('expose la durée passée en option', () => {
    const { result } = renderHook(() => useHoldAcceptButton({ onConfirm: vi.fn(), duration: 3000 }))
    expect(result.current.duration).toBe(3000)
  })

  it('start en pressing est sans effet (pas de double timer)', () => {
    const onConfirm = vi.fn()
    const { result } = renderHook(() => useHoldAcceptButton({ onConfirm, duration: 1000 }))
    act(() => { result.current.start() })
    act(() => { result.current.start() })
    act(() => { vi.advanceTimersByTime(1600) })
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('durée par défaut est 2000ms', () => {
    const { result } = renderHook(() => useHoldAcceptButton({ onConfirm: vi.fn() }))
    expect(result.current.duration).toBe(2000)
  })
})
