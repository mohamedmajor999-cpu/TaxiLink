import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDriverProfilTab } from '@/components/dashboard/driver/useDriverProfilTab'

describe('useDriverProfilTab — état initial', () => {
  it('active démarre sur "profil"', () => {
    const { result } = renderHook(() => useDriverProfilTab())
    expect(result.current.active).toBe('profil')
  })

  it('expose 3 sous-onglets', () => {
    const { result } = renderHook(() => useDriverProfilTab())
    expect(result.current.subTabs).toHaveLength(3)
  })

  it('subTabs contient profil, stats, documents', () => {
    const { result } = renderHook(() => useDriverProfilTab())
    const ids = result.current.subTabs.map(t => t.id)
    expect(ids).toContain('profil')
    expect(ids).toContain('stats')
    expect(ids).toContain('documents')
  })
})

describe('useDriverProfilTab — navigation', () => {
  it('setActive change vers "stats"', () => {
    const { result } = renderHook(() => useDriverProfilTab())
    act(() => { result.current.setActive('stats') })
    expect(result.current.active).toBe('stats')
  })

  it('setActive change vers "documents"', () => {
    const { result } = renderHook(() => useDriverProfilTab())
    act(() => { result.current.setActive('documents') })
    expect(result.current.active).toBe('documents')
  })

  it('retourne à "profil" depuis "stats"', () => {
    const { result } = renderHook(() => useDriverProfilTab())
    act(() => { result.current.setActive('stats') })
    act(() => { result.current.setActive('profil') })
    expect(result.current.active).toBe('profil')
  })
})
