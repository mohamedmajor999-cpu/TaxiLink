import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useToastItem } from '@/components/ui/useToastItem'

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(0); return 0 })
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('useToastItem — visible', () => {
  it('visible passe à true après requestAnimationFrame', () => {
    const { result } = renderHook(() => useToastItem('t1', vi.fn()))
    expect(result.current.visible).toBe(true)
  })
})

describe('useToastItem — auto-dismiss', () => {
  it('appelle onDismiss après 4300ms (4000 + 300)', () => {
    const onDismiss = vi.fn()
    renderHook(() => useToastItem('t1', onDismiss))
    act(() => { vi.advanceTimersByTime(4300) })
    expect(onDismiss).toHaveBeenCalledWith('t1')
  })

  it('n\'appelle pas onDismiss avant 4300ms', () => {
    const onDismiss = vi.fn()
    renderHook(() => useToastItem('t2', onDismiss))
    act(() => { vi.advanceTimersByTime(4000) })
    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('nettoie le timer au démontage', () => {
    const onDismiss = vi.fn()
    const { unmount } = renderHook(() => useToastItem('t3', onDismiss))
    unmount()
    act(() => { vi.advanceTimersByTime(5000) })
    expect(onDismiss).not.toHaveBeenCalled()
  })
})

describe('useToastItem — dismiss()', () => {
  it('dismiss() appelle onDismiss après 300ms', () => {
    const onDismiss = vi.fn()
    const { result } = renderHook(() => useToastItem('t4', onDismiss))
    act(() => { result.current.dismiss() })
    expect(onDismiss).not.toHaveBeenCalled()
    act(() => { vi.advanceTimersByTime(300) })
    expect(onDismiss).toHaveBeenCalledWith('t4')
  })
})
