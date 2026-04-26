import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDriverCoursesScreen } from '@/components/dashboard/driver/courses/useDriverCoursesScreen'
import { usePostedAcceptStore } from '@/store/postedAcceptStore'

// ─── Mocks next/navigation ────────────────────────────────────────────────────
const mockPush = vi.fn()
let currentSearch = ''

vi.mock('next/navigation', () => ({
  useRouter:       () => ({ push: mockPush }),
  usePathname:     () => '/dashboard/chauffeur',
  useSearchParams: () => new URLSearchParams(currentSearch),
}))

function seedUnseen(missionId = 'm1') {
  usePostedAcceptStore.getState().add({
    missionId,
    departure: 'A',
    destination: 'B',
    acceptedAt: new Date().toISOString(),
    driverName: 'X',
    driverPhone: null,
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  currentSearch = 'tab=courses'
  usePostedAcceptStore.getState().reset()
})

describe('useDriverCoursesScreen — lecture URL', () => {
  it("onglet actif par defaut = 'upcoming' quand aucun ?subtab=", () => {
    const { result } = renderHook(() => useDriverCoursesScreen())
    expect(result.current.active).toBe('upcoming')
  })

  it("lit 'history' depuis ?subtab=history", () => {
    currentSearch = 'tab=courses&subtab=history'
    const { result } = renderHook(() => useDriverCoursesScreen())
    expect(result.current.active).toBe('history')
  })

  it("fallback 'upcoming' si ?subtab= invalide", () => {
    currentSearch = 'tab=courses&subtab=bidon'
    const { result } = renderHook(() => useDriverCoursesScreen())
    expect(result.current.active).toBe('upcoming')
  })
})

describe('useDriverCoursesScreen — setActive (push URL)', () => {
  it("push ?subtab=history en preservant ?tab=courses", () => {
    const { result } = renderHook(() => useDriverCoursesScreen())
    act(() => { result.current.setActive('history') })
    expect(mockPush).toHaveBeenCalledWith('/dashboard/chauffeur?tab=courses&subtab=history')
  })

  it("retire ?subtab quand on revient sur 'upcoming'", () => {
    currentSearch = 'tab=courses&subtab=history'
    const { result } = renderHook(() => useDriverCoursesScreen())
    act(() => { result.current.setActive('upcoming') })
    expect(mockPush).toHaveBeenCalledWith('/dashboard/chauffeur?tab=courses')
  })
})

describe('useDriverCoursesScreen — subTabs + badge', () => {
  it('subTabs contient 3 entrées (À venir, Postées, Historique — agenda fusionné dans À venir)', () => {
    const { result } = renderHook(() => useDriverCoursesScreen())
    expect(result.current.subTabs).toHaveLength(3)
    expect(result.current.subTabs.map((t) => t.id)).toEqual(['upcoming', 'posted', 'history'])
  })

  it('dateLabel est une chaine non vide', () => {
    const { result } = renderHook(() => useDriverCoursesScreen())
    expect(result.current.dateLabel).toBeTruthy()
  })

  it("sous-onglet 'Postees' porte badge=N quand il y a N acceptation(s) non vue(s)", () => {
    seedUnseen('m1')
    seedUnseen('m2')
    const { result } = renderHook(() => useDriverCoursesScreen())
    const posted = result.current.subTabs.find((t) => t.id === 'posted')
    expect(posted?.badge).toBe(2)
    expect(result.current.postedBadge).toBe(2)
  })
})

describe('useDriverCoursesScreen — effets sur acceptations non vues', () => {
  it("setActive('posted') vide les acceptations non vues", () => {
    seedUnseen('m1')
    const { result } = renderHook(() => useDriverCoursesScreen())
    act(() => { result.current.setActive('posted') })
    expect(Object.keys(usePostedAcceptStore.getState().unseen)).toHaveLength(0)
  })

  it("setActive('history') ne vide pas les acceptations non vues", () => {
    seedUnseen('m1')
    const { result } = renderHook(() => useDriverCoursesScreen())
    act(() => { result.current.setActive('history') })
    expect(usePostedAcceptStore.getState().unseen['m1']).toBeTruthy()
  })

  it("arriver deja sur ?subtab=posted avec des unseen les vide", () => {
    seedUnseen('m1')
    currentSearch = 'tab=courses&subtab=posted'
    renderHook(() => useDriverCoursesScreen())
    expect(Object.keys(usePostedAcceptStore.getState().unseen)).toHaveLength(0)
  })
})
