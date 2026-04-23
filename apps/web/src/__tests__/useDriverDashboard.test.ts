import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDriverDashboard } from '@/components/dashboard/driver/useDriverDashboard'

// ─── Mocks next/navigation ────────────────────────────────────────────────────
const mockPush = vi.fn()
let currentSearch = ''

vi.mock('next/navigation', () => ({
  useRouter:       () => ({ push: mockPush }),
  usePathname:     () => '/dashboard/chauffeur',
  useSearchParams: () => new URLSearchParams(currentSearch),
}))

beforeEach(() => {
  vi.clearAllMocks()
  currentSearch = ''
})

// ─── État initial ─────────────────────────────────────────────────────────────
describe('useDriverDashboard — état initial', () => {
  it('démarre sur "home" quand aucun ?tab=', () => {
    const { result } = renderHook(() => useDriverDashboard())
    expect(result.current.activeTab).toBe('home')
  })

  it('lit "profil" depuis ?tab=profil', () => {
    currentSearch = 'tab=profil'
    const { result } = renderHook(() => useDriverDashboard())
    expect(result.current.activeTab).toBe('profil')
  })

  it('fallback "home" si ?tab= invalide', () => {
    currentSearch = 'tab=xyz'
    const { result } = renderHook(() => useDriverDashboard())
    expect(result.current.activeTab).toBe('home')
  })

  it('showCreer est false au départ', () => {
    const { result } = renderHook(() => useDriverDashboard())
    expect(result.current.showCreer).toBe(false)
  })
})

// ─── Navigation onglets (push URL) ────────────────────────────────────────────
describe('useDriverDashboard — setActiveTab', () => {
  it('push ?tab=courses', () => {
    const { result } = renderHook(() => useDriverDashboard())
    act(() => { result.current.setActiveTab('courses') })
    expect(mockPush).toHaveBeenCalledWith('/dashboard/chauffeur?tab=courses')
  })

  it('push ?tab=profil', () => {
    const { result } = renderHook(() => useDriverDashboard())
    act(() => { result.current.setActiveTab('profil') })
    expect(mockPush).toHaveBeenCalledWith('/dashboard/chauffeur?tab=profil')
  })

  it('push sans query quand on revient sur "home"', () => {
    currentSearch = 'tab=profil'
    const { result } = renderHook(() => useDriverDashboard())
    act(() => { result.current.setActiveTab('home') })
    expect(mockPush).toHaveBeenCalledWith('/dashboard/chauffeur')
  })

  it('reset detailMissionId lors du changement', () => {
    const { result } = renderHook(() => useDriverDashboard())
    act(() => { result.current.setDetailMissionId('m1') })
    act(() => { result.current.setActiveTab('courses') })
    expect(result.current.detailMissionId).toBeNull()
  })
})

// ─── showCreer ────────────────────────────────────────────────────────────────
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
