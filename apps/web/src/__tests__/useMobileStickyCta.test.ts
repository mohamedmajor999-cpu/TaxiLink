import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMobileStickyCta } from '@/components/site/useMobileStickyCta'

beforeEach(() => {
  Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useMobileStickyCta', () => {
  it('visible=false par défaut (scrollY=0)', () => {
    const { result } = renderHook(() => useMobileStickyCta())
    expect(result.current.visible).toBe(false)
  })

  it('visible=true quand scrollY>420 (sans footer dans le DOM)', () => {
    Object.defineProperty(window, 'scrollY', { value: 500, writable: true, configurable: true })
    const { result } = renderHook(() => useMobileStickyCta())
    // Initial mount appelle onScroll() → scrolledEnough=true, footerVisible=false
    expect(result.current.visible).toBe(true)
  })

  it('scroll event déclenche la mise à jour de visible', () => {
    const { result } = renderHook(() => useMobileStickyCta())
    Object.defineProperty(window, 'scrollY', { value: 500, writable: true, configurable: true })
    act(() => { window.dispatchEvent(new Event('scroll')) })
    expect(result.current.visible).toBe(true)
  })

  it('visible repasse à false si scroll < 420', () => {
    Object.defineProperty(window, 'scrollY', { value: 500, writable: true, configurable: true })
    const { result } = renderHook(() => useMobileStickyCta())
    expect(result.current.visible).toBe(true)
    Object.defineProperty(window, 'scrollY', { value: 100, writable: true, configurable: true })
    act(() => { window.dispatchEvent(new Event('scroll')) })
    expect(result.current.visible).toBe(false)
  })
})
