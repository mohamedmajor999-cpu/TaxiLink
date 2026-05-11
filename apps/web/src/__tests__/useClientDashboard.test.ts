import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useClientDashboard } from '@/components/dashboard/client/useClientDashboard'

// ─── Mocks next/navigation ────────────────────────────────────────────────────
const mockReplace = vi.fn()
let currentSearch = ''

vi.mock('next/navigation', () => ({
  useRouter:       () => ({ replace: mockReplace }),
  usePathname:     () => '/dashboard/client',
  useSearchParams: () => new URLSearchParams(currentSearch),
}))

beforeEach(() => {
  vi.clearAllMocks()
  currentSearch = ''
})

describe('useClientDashboard — état initial', () => {
  it('démarre sur "reserver" quand aucun ?tab=', () => {
    const { result } = renderHook(() => useClientDashboard())
    expect(result.current.tab).toBe('reserver')
  })

  it('lit "mes-courses" depuis ?tab=mes-courses', () => {
    currentSearch = 'tab=mes-courses'
    const { result } = renderHook(() => useClientDashboard())
    expect(result.current.tab).toBe('mes-courses')
  })

  it('fallback "reserver" si ?tab= invalide', () => {
    currentSearch = 'tab=bidon'
    const { result } = renderHook(() => useClientDashboard())
    expect(result.current.tab).toBe('reserver')
  })
})

describe('useClientDashboard — setTab', () => {
  it('replace /dashboard/client?tab=mes-courses', () => {
    const { result } = renderHook(() => useClientDashboard())
    act(() => { result.current.setTab('mes-courses') })
    expect(mockReplace).toHaveBeenCalledWith('/dashboard/client?tab=mes-courses')
  })

  it('replace /dashboard/client (sans query) quand on revient sur "reserver"', () => {
    currentSearch = 'tab=mes-courses'
    const { result } = renderHook(() => useClientDashboard())
    act(() => { result.current.setTab('reserver') })
    expect(mockReplace).toHaveBeenCalledWith('/dashboard/client')
  })
})
