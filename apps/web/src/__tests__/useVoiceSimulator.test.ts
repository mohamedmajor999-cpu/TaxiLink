import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useVoiceSimulator } from '@/components/onboarding/useVoiceSimulator'

afterEach(() => { vi.useRealTimers() })

describe('useVoiceSimulator — etat initial', () => {
  it('demarre en idle avec filled a 0', () => {
    const { result } = renderHook(() => useVoiceSimulator())
    expect(result.current.state).toBe('idle')
    expect(result.current.filled).toBe(0)
  })
})

describe('useVoiceSimulator — run', () => {
  it('passe en listening immediatement apres run()', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useVoiceSimulator())
    act(() => { result.current.run() })
    expect(result.current.state).toBe('listening')
  })

  it('passe en done apres tous les timers', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useVoiceSimulator())
    act(() => { result.current.run() })
    act(() => { vi.runAllTimers() })
    expect(result.current.state).toBe('done')
    expect(result.current.filled).toBe(4)
  })

  it('run() est sans effet si deja en cours', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useVoiceSimulator())
    act(() => { result.current.run() })
    act(() => { result.current.run() }) // deuxième appel ignoré
    expect(result.current.state).toBe('listening')
  })
})

describe('useVoiceSimulator — reset', () => {
  it('reset remet state a idle et filled a 0', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useVoiceSimulator())
    act(() => { result.current.run() })
    act(() => { vi.runAllTimers() })
    expect(result.current.state).toBe('done')
    act(() => { result.current.reset() })
    expect(result.current.state).toBe('idle')
    expect(result.current.filled).toBe(0)
  })
})
