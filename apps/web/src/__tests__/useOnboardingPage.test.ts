import { describe, it, expect } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useOnboardingPage } from '@/components/onboarding/useOnboardingPage'

describe('useOnboardingPage — étapes', () => {
  it('démarre sur le splash et avance vers slide1 via next()', () => {
    const { result } = renderHook(() => useOnboardingPage())
    expect(result.current.step).toBe('splash')

    act(() => { result.current.next() })
    expect(result.current.step).toBe('slide1')
    expect(result.current.slideIndex).toBe(0)
  })

  it('next() navigue splash → slide1 → slide2 → slide3 → welcome', () => {
    const { result } = renderHook(() => useOnboardingPage())

    act(() => { result.current.next() })
    expect(result.current.step).toBe('slide1')

    act(() => { result.current.next() })
    expect(result.current.step).toBe('slide2')

    act(() => { result.current.next() })
    expect(result.current.step).toBe('slide3')

    act(() => { result.current.next() })
    expect(result.current.step).toBe('welcome')
  })

  it('skip() saute directement à welcome', () => {
    const { result } = renderHook(() => useOnboardingPage())

    act(() => { result.current.skip() })
    expect(result.current.step).toBe('welcome')
  })

  it('markSeen() est exposé comme fonction idempotente', () => {
    const { result } = renderHook(() => useOnboardingPage())
    expect(() => act(() => { result.current.markSeen() })).not.toThrow()
    expect(() => act(() => { result.current.markSeen() })).not.toThrow()
  })
})
