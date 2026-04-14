import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useNavbar } from '@/components/site/useNavbar'

describe('useNavbar — toggle', () => {
  it('toggle ouvre le menu si ferme', () => {
    const { result } = renderHook(() => useNavbar())
    expect(result.current.open).toBe(false)
    act(() => { result.current.toggle() })
    expect(result.current.open).toBe(true)
  })

  it('toggle ferme le menu si ouvert', () => {
    const { result } = renderHook(() => useNavbar())
    act(() => { result.current.toggle() })
    act(() => { result.current.toggle() })
    expect(result.current.open).toBe(false)
  })
})

describe('useNavbar — close', () => {
  it('close ferme le menu meme si deja ouvert', () => {
    const { result } = renderHook(() => useNavbar())
    act(() => { result.current.toggle() })
    expect(result.current.open).toBe(true)
    act(() => { result.current.close() })
    expect(result.current.open).toBe(false)
  })
})
