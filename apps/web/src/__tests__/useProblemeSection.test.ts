import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useProblemeSection, FIELDS } from '@/components/site/useProblemeSection'

beforeEach(() => { vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers() })

describe('useProblemeSection — état initial', () => {
  it('state est "idle" au départ', () => {
    const { result } = renderHook(() => useProblemeSection())
    expect(result.current.state).toBe('idle')
  })

  it('filledCount est 0 au départ', () => {
    const { result } = renderHook(() => useProblemeSection())
    expect(result.current.filledCount).toBe(0)
  })

  it('expose 4 champs', () => {
    const { result } = renderHook(() => useProblemeSection())
    expect(result.current.fields).toHaveLength(4)
  })

  it('le premier champ est "depart"', () => {
    const { result } = renderHook(() => useProblemeSection())
    expect(result.current.fields[0].key).toBe('depart')
  })
})

describe('useProblemeSection — séquence start()', () => {
  it('start() passe en "listening"', () => {
    const { result } = renderHook(() => useProblemeSection())
    act(() => { result.current.start() })
    expect(result.current.state).toBe('listening')
  })

  it('start() remet filledCount à 0', () => {
    const { result } = renderHook(() => useProblemeSection())
    act(() => { result.current.start() })
    act(() => { vi.advanceTimersByTime(900 + 500) })
    act(() => { result.current.start() })
    expect(result.current.filledCount).toBe(0)
  })

  it('passe en "filling" après 900ms', () => {
    const { result } = renderHook(() => useProblemeSection())
    act(() => { result.current.start() })
    act(() => { vi.advanceTimersByTime(900) })
    expect(result.current.state).toBe('filling')
  })

  it('remplit un champ toutes les 500ms', () => {
    const { result } = renderHook(() => useProblemeSection())
    act(() => { result.current.start() })
    act(() => { vi.advanceTimersByTime(900) })
    act(() => { vi.advanceTimersByTime(500) })
    expect(result.current.filledCount).toBe(1)
    act(() => { vi.advanceTimersByTime(500) })
    expect(result.current.filledCount).toBe(2)
  })

  it('passe en "done" après tous les champs + 400ms', () => {
    const { result } = renderHook(() => useProblemeSection())
    act(() => { result.current.start() })
    act(() => { vi.advanceTimersByTime(900) }) // → 'filling'
    for (let i = 0; i < FIELDS.length; i++) {
      act(() => { vi.advanceTimersByTime(500) }) // +1 champ
    }
    act(() => { vi.advanceTimersByTime(400) }) // → 'done'
    expect(result.current.state).toBe('done')
    expect(result.current.filledCount).toBe(FIELDS.length)
  })
})
