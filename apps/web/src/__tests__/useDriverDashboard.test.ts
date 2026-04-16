import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDriverDashboard } from '@/components/dashboard/driver/useDriverDashboard'

describe('useDriverDashboard — état initial', () => {
  it('démarre sur l\'onglet "missions"', () => {
    const { result } = renderHook(() => useDriverDashboard())
    expect(result.current.activeTab).toBe('missions')
  })

  it('showCreer est false au départ', () => {
    const { result } = renderHook(() => useDriverDashboard())
    expect(result.current.showCreer).toBe(false)
  })
})

describe('useDriverDashboard — navigation onglets', () => {
  it('change d\'onglet vers "agenda"', () => {
    const { result } = renderHook(() => useDriverDashboard())
    act(() => { result.current.setActiveTab('agenda') })
    expect(result.current.activeTab).toBe('agenda')
  })

  it('change d\'onglet vers "groupes"', () => {
    const { result } = renderHook(() => useDriverDashboard())
    act(() => { result.current.setActiveTab('groupes') })
    expect(result.current.activeTab).toBe('groupes')
  })

  it('change d\'onglet vers "profil"', () => {
    const { result } = renderHook(() => useDriverDashboard())
    act(() => { result.current.setActiveTab('profil') })
    expect(result.current.activeTab).toBe('profil')
  })
})

describe('useDriverDashboard — showCreer', () => {
  it('passe showCreer à true', () => {
    const { result } = renderHook(() => useDriverDashboard())
    act(() => { result.current.setShowCreer(true) })
    expect(result.current.showCreer).toBe(true)
  })

  it('repasse showCreer à false', () => {
    const { result } = renderHook(() => useDriverDashboard())
    act(() => { result.current.setShowCreer(true) })
    act(() => { result.current.setShowCreer(false) })
    expect(result.current.showCreer).toBe(false)
  })
})
