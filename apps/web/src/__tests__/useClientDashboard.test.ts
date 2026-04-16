import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useClientDashboard } from '@/components/dashboard/client/useClientDashboard'

describe('useClientDashboard — état initial', () => {
  it('démarre sur l\'onglet "reserver"', () => {
    const { result } = renderHook(() => useClientDashboard())
    expect(result.current.tab).toBe('reserver')
  })
})

describe('useClientDashboard — setTab', () => {
  it('change d\'onglet vers "mes-courses"', () => {
    const { result } = renderHook(() => useClientDashboard())
    act(() => { result.current.setTab('mes-courses') })
    expect(result.current.tab).toBe('mes-courses')
  })

  it('revient sur "reserver"', () => {
    const { result } = renderHook(() => useClientDashboard())
    act(() => { result.current.setTab('mes-courses') })
    act(() => { result.current.setTab('reserver') })
    expect(result.current.tab).toBe('reserver')
  })
})
