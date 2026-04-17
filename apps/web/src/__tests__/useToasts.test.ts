import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useToasts } from '@/hooks/useToasts'

// Date.now() utilisé comme id — on avance le temps entre chaque ajout pour éviter les collisions
beforeEach(() => { vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers() })

describe('useToasts — état initial', () => {
  it('démarre avec 0 toast', () => {
    const { result } = renderHook(() => useToasts())
    expect(result.current.toasts).toHaveLength(0)
  })
})

describe('useToasts — addToast', () => {
  it('ajoute un toast avec un id généré', () => {
    const { result } = renderHook(() => useToasts())
    act(() => { result.current.addToast({ message: 'Bonjour', type: 'success' }) })
    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].message).toBe('Bonjour')
    expect(typeof result.current.toasts[0].id).toBe('string')
  })

  it('accumule plusieurs toasts', () => {
    const { result } = renderHook(() => useToasts())
    act(() => { result.current.addToast({ message: 'A', type: 'info' }) })
    act(() => { vi.advanceTimersByTime(1); result.current.addToast({ message: 'B', type: 'warning' }) })
    expect(result.current.toasts).toHaveLength(2)
  })

  it('chaque toast a un id unique', () => {
    const { result } = renderHook(() => useToasts())
    act(() => { result.current.addToast({ message: 'A', type: 'info' }) })
    act(() => { vi.advanceTimersByTime(1); result.current.addToast({ message: 'B', type: 'info' }) })
    const ids = result.current.toasts.map(t => t.id)
    expect(new Set(ids).size).toBe(2)
  })
})

describe('useToasts — dismissToast', () => {
  it('supprime le toast par id', () => {
    const { result } = renderHook(() => useToasts())
    act(() => { result.current.addToast({ message: 'Test', type: 'info' }) })
    const id = result.current.toasts[0].id
    act(() => { result.current.dismissToast(id) })
    expect(result.current.toasts).toHaveLength(0)
  })

  it('ne supprime pas les autres toasts', () => {
    const { result } = renderHook(() => useToasts())
    act(() => { result.current.addToast({ message: 'A', type: 'info' }) })
    act(() => { vi.advanceTimersByTime(1); result.current.addToast({ message: 'B', type: 'success' }) })
    const id = result.current.toasts[0].id
    act(() => { result.current.dismissToast(id) })
    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].message).toBe('B')
  })

  it('id inexistant ne change rien', () => {
    const { result } = renderHook(() => useToasts())
    act(() => { result.current.addToast({ message: 'X', type: 'info' }) })
    act(() => { vi.advanceTimersByTime(1); result.current.dismissToast('inexistant') })
    expect(result.current.toasts).toHaveLength(1)
  })
})
