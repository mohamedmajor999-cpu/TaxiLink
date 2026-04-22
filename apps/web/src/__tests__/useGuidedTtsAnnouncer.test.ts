import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useGuidedTtsAnnouncer } from '@/components/dashboard/driver/guided/useGuidedTtsAnnouncer'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

function makeOpts(overrides: Partial<Parameters<typeof useGuidedTtsAnnouncer>[0]> = {}) {
  return {
    qId: 'type',
    promptText: 'Est-ce une course CPAM ?',
    active: true,
    autoSpeak: false,
    speak: vi.fn().mockResolvedValue(undefined),
    isSupported: true,
    ...overrides,
  }
}

describe('useGuidedTtsAnnouncer — active=false', () => {
  it('retourne null quand active=false', () => {
    const { result } = renderHook(() => useGuidedTtsAnnouncer(makeOpts({ active: false })))
    expect(result.current).toBeNull()
  })
})

describe('useGuidedTtsAnnouncer — autoSpeak=false', () => {
  it('announcedId = qId immédiatement sans appeler speak', () => {
    const speak = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() =>
      useGuidedTtsAnnouncer(makeOpts({ autoSpeak: false, speak })),
    )
    expect(result.current).toBe('type')
    expect(speak).not.toHaveBeenCalled()
  })

  it('isSupported=false → announcedId = qId immédiatement', () => {
    const { result } = renderHook(() =>
      useGuidedTtsAnnouncer(makeOpts({ autoSpeak: true, isSupported: false })),
    )
    expect(result.current).toBe('type')
  })
})

describe('useGuidedTtsAnnouncer — autoSpeak=true', () => {
  it('appelle speak et positionne announcedId quand speak résout', async () => {
    let resolveSpeech!: () => void
    const speak = vi.fn().mockImplementation(
      () => new Promise<void>((res) => { resolveSpeech = res }),
    )
    const { result } = renderHook(() =>
      useGuidedTtsAnnouncer(makeOpts({ autoSpeak: true, speak })),
    )
    expect(speak).toHaveBeenCalledWith('Est-ce une course CPAM ?')
    expect(result.current).toBeNull() // pas encore annoncé

    await act(async () => { resolveSpeech() })
    expect(result.current).toBe('type')
  })

  it('fallback 6s : announcedId = qId même si speak ne résout pas', () => {
    const speak = vi.fn().mockImplementation(() => new Promise(() => {})) // jamais résolue
    const { result } = renderHook(() =>
      useGuidedTtsAnnouncer(makeOpts({ autoSpeak: true, speak })),
    )
    expect(result.current).toBeNull()

    act(() => { vi.advanceTimersByTime(6000) })
    expect(result.current).toBe('type')
  })

  it('ne re-parle pas si qId ne change pas', () => {
    const speak = vi.fn().mockResolvedValue(undefined)
    const opts = makeOpts({ autoSpeak: true, speak })
    const { rerender } = renderHook(() => useGuidedTtsAnnouncer(opts))
    rerender()
    expect(speak).toHaveBeenCalledTimes(1)
  })
})
