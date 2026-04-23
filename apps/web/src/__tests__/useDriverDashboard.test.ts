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

// ─── État initial (lecture URL) ───────────────────────────────────────────────
describe('useDriverDashboard — lecture URL', () => {
  it('démarre sur "home" quand aucun query', () => {
    const { result } = renderHook(() => useDriverDashboard())
    expect(result.current.activeTab).toBe('home')
    expect(result.current.detailMissionId).toBeNull()
    expect(result.current.showCreer).toBe(false)
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

  it('lit detailMissionId depuis ?mission=abc', () => {
    currentSearch = 'mission=abc'
    const { result } = renderHook(() => useDriverDashboard())
    expect(result.current.detailMissionId).toBe('abc')
  })

  it('lit showCreer depuis ?creer=1', () => {
    currentSearch = 'creer=1'
    const { result } = renderHook(() => useDriverDashboard())
    expect(result.current.showCreer).toBe(true)
  })
})

// ─── setActiveTab (push URL) ──────────────────────────────────────────────────
describe('useDriverDashboard — setActiveTab', () => {
  it('push ?tab=courses', () => {
    const { result } = renderHook(() => useDriverDashboard())
    act(() => { result.current.setActiveTab('courses') })
    expect(mockPush).toHaveBeenCalledWith('/dashboard/chauffeur?tab=courses')
  })

  it('push sans query quand on revient sur "home"', () => {
    currentSearch = 'tab=profil'
    const { result } = renderHook(() => useDriverDashboard())
    act(() => { result.current.setActiveTab('home') })
    expect(mockPush).toHaveBeenCalledWith('/dashboard/chauffeur')
  })

  it('efface mission et creer lors du changement d\'onglet', () => {
    currentSearch = 'mission=abc&creer=1'
    const { result } = renderHook(() => useDriverDashboard())
    act(() => { result.current.setActiveTab('courses') })
    expect(mockPush).toHaveBeenCalledWith('/dashboard/chauffeur?tab=courses')
  })
})

// ─── setDetailMissionId ───────────────────────────────────────────────────────
describe('useDriverDashboard — setDetailMissionId', () => {
  it('push ?mission=<id>', () => {
    const { result } = renderHook(() => useDriverDashboard())
    act(() => { result.current.setDetailMissionId('m1') })
    expect(mockPush).toHaveBeenCalledWith('/dashboard/chauffeur?mission=m1')
  })

  it('retire ?mission quand on passe null', () => {
    currentSearch = 'mission=m1'
    const { result } = renderHook(() => useDriverDashboard())
    act(() => { result.current.setDetailMissionId(null) })
    expect(mockPush).toHaveBeenCalledWith('/dashboard/chauffeur')
  })

  it('preserve ?tab= lors de l\'ouverture du detail', () => {
    currentSearch = 'tab=courses'
    const { result } = renderHook(() => useDriverDashboard())
    act(() => { result.current.setDetailMissionId('m1') })
    expect(mockPush).toHaveBeenCalledWith('/dashboard/chauffeur?tab=courses&mission=m1')
  })
})

// ─── setShowCreer ─────────────────────────────────────────────────────────────
describe('useDriverDashboard — setShowCreer', () => {
  it('push ?creer=1 a l\'ouverture', () => {
    const { result } = renderHook(() => useDriverDashboard())
    act(() => { result.current.setShowCreer(true) })
    expect(mockPush).toHaveBeenCalledWith('/dashboard/chauffeur?creer=1')
  })

  it('retire ?creer a la fermeture', () => {
    currentSearch = 'creer=1'
    const { result } = renderHook(() => useDriverDashboard())
    act(() => { result.current.setShowCreer(false) })
    expect(mockPush).toHaveBeenCalledWith('/dashboard/chauffeur')
  })
})
