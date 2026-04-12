import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useProblemeSection, FIELDS } from './useProblemeSection'

describe('FIELDS', () => {
  it('contient 4 champs', () => {
    expect(FIELDS).toHaveLength(4)
  })

  it('contient les clés attendues', () => {
    const keys = FIELDS.map((f) => f.key)
    expect(keys).toEqual(['depart', 'arrivee', 'prix', 'heure'])
  })

  it('chaque champ a un label et une valeur non vides', () => {
    FIELDS.forEach((f) => {
      expect(f.label.length).toBeGreaterThan(0)
      expect(f.value.length).toBeGreaterThan(0)
    })
  })
})

describe('useProblemeSection', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('démarre en état idle avec 0 champs remplis', () => {
    const { result } = renderHook(() => useProblemeSection())
    expect(result.current.state).toBe('idle')
    expect(result.current.filledCount).toBe(0)
    expect(result.current.fields).toBe(FIELDS)
  })

  it('passe à listening après start()', () => {
    const { result } = renderHook(() => useProblemeSection())
    act(() => { result.current.start() })
    expect(result.current.state).toBe('listening')
    expect(result.current.filledCount).toBe(0)
  })

  it('passe à filling après 900ms', () => {
    const { result } = renderHook(() => useProblemeSection())
    act(() => { result.current.start() })
    act(() => { vi.advanceTimersByTime(900) })
    expect(result.current.state).toBe('filling')
  })

  it('remplit un champ toutes les 500ms', () => {
    const { result } = renderHook(() => useProblemeSection())
    act(() => { result.current.start() })
    act(() => { vi.advanceTimersByTime(900) }) // → filling

    act(() => { vi.advanceTimersByTime(500) })
    expect(result.current.filledCount).toBe(1)

    act(() => { vi.advanceTimersByTime(500) })
    expect(result.current.filledCount).toBe(2)

    act(() => { vi.advanceTimersByTime(500) })
    expect(result.current.filledCount).toBe(3)

    act(() => { vi.advanceTimersByTime(500) })
    expect(result.current.filledCount).toBe(4)
  })

  it('passe à done après que tous les champs sont remplis', () => {
    const { result } = renderHook(() => useProblemeSection())
    act(() => { result.current.start() })
    act(() => { vi.advanceTimersByTime(900) })  // → filling
    act(() => { vi.advanceTimersByTime(500) })  // filledCount = 1
    act(() => { vi.advanceTimersByTime(500) })  // filledCount = 2
    act(() => { vi.advanceTimersByTime(500) })  // filledCount = 3
    act(() => { vi.advanceTimersByTime(500) })  // filledCount = 4
    act(() => { vi.advanceTimersByTime(400) })  // → done
    expect(result.current.state).toBe('done')
  })

  it('remet à zéro si start() est appelé en cours de simulation', () => {
    const { result } = renderHook(() => useProblemeSection())
    act(() => { result.current.start() })
    act(() => { vi.advanceTimersByTime(900) })  // → filling
    act(() => { vi.advanceTimersByTime(500) })  // filledCount = 1

    act(() => { result.current.start() })
    expect(result.current.state).toBe('listening')
    expect(result.current.filledCount).toBe(0)
  })
})
