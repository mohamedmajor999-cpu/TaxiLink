import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLandingNav } from '@/components/site/useLandingNav'

describe('useLandingNav', () => {
  it('menuOpen=false par défaut', () => {
    const { result } = renderHook(() => useLandingNav())
    expect(result.current.menuOpen).toBe(false)
  })

  it('openMenu() passe menuOpen à true', () => {
    const { result } = renderHook(() => useLandingNav())
    act(() => { result.current.openMenu() })
    expect(result.current.menuOpen).toBe(true)
  })

  it('closeMenu() passe menuOpen à false', () => {
    const { result } = renderHook(() => useLandingNav())
    act(() => { result.current.openMenu() })
    act(() => { result.current.closeMenu() })
    expect(result.current.menuOpen).toBe(false)
  })

  it('document.body.overflow=hidden quand menu ouvert', () => {
    const { result } = renderHook(() => useLandingNav())
    act(() => { result.current.openMenu() })
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('overflow restauré après closeMenu', () => {
    const { result } = renderHook(() => useLandingNav())
    act(() => { result.current.openMenu() })
    act(() => { result.current.closeMenu() })
    expect(document.body.style.overflow).not.toBe('hidden')
  })
})
