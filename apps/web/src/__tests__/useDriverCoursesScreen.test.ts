import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDriverCoursesScreen } from '@/components/dashboard/driver/courses/useDriverCoursesScreen'
import { usePostedAcceptStore } from '@/store/postedAcceptStore'

// ─── Mocks next/navigation ────────────────────────────────────────────────────
const mockPush = vi.fn()
const mockReplace = vi.fn()
let currentSearch = ''

vi.mock('next/navigation', () => ({
  useRouter:       () => ({ push: mockPush, replace: mockReplace }),
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
  it("onglet actif par defaut = 'today' quand aucun ?subtab=", () => {
    const { result } = renderHook(() => useDriverCoursesScreen())
    expect(result.current.active).toBe('today')
  })

  it("lit 'agenda' depuis ?subtab=agenda", () => {
    currentSearch = 'tab=courses&subtab=agenda'
    const { result } = renderHook(() => useDriverCoursesScreen())
    expect(result.current.active).toBe('agenda')
  })

  it("lit 'ads' depuis ?subtab=ads", () => {
    currentSearch = 'tab=courses&subtab=ads'
    const { result } = renderHook(() => useDriverCoursesScreen())
    expect(result.current.active).toBe('ads')
  })

  it("fallback 'today' si ?subtab= invalide", () => {
    currentSearch = 'tab=courses&subtab=bidon'
    const { result } = renderHook(() => useDriverCoursesScreen())
    expect(result.current.active).toBe('today')
  })
})

describe('useDriverCoursesScreen — rétro-compat URL legacy', () => {
  it("?subtab=upcoming est interprété comme 'today'", () => {
    currentSearch = 'tab=courses&subtab=upcoming'
    const { result } = renderHook(() => useDriverCoursesScreen())
    expect(result.current.active).toBe('today')
  })

  it("?subtab=posted est interprété comme 'ads'", () => {
    currentSearch = 'tab=courses&subtab=posted'
    const { result } = renderHook(() => useDriverCoursesScreen())
    expect(result.current.active).toBe('ads')
  })

  it("?subtab=history est redirige vers 'stats' (l'historique est integre a Stats)", () => {
    currentSearch = 'tab=courses&subtab=history'
    const { result } = renderHook(() => useDriverCoursesScreen())
    expect(result.current.active).toBe('stats')
    expect(mockReplace).toHaveBeenCalledWith('/dashboard/chauffeur?tab=courses&subtab=stats')
  })

  it("?subtab=posted normalise l'URL via replace en ads", () => {
    currentSearch = 'tab=courses&subtab=posted'
    renderHook(() => useDriverCoursesScreen())
    expect(mockReplace).toHaveBeenCalledWith('/dashboard/chauffeur?tab=courses&subtab=ads')
  })
})

describe('useDriverCoursesScreen — setActive (push URL)', () => {
  it("push ?subtab=agenda en preservant ?tab=courses", () => {
    const { result } = renderHook(() => useDriverCoursesScreen())
    act(() => { result.current.setActive('agenda') })
    expect(mockPush).toHaveBeenCalledWith('/dashboard/chauffeur?tab=courses&subtab=agenda')
  })

  it("push ?subtab=ads", () => {
    const { result } = renderHook(() => useDriverCoursesScreen())
    act(() => { result.current.setActive('ads') })
    expect(mockPush).toHaveBeenCalledWith('/dashboard/chauffeur?tab=courses&subtab=ads')
  })

  it("retire ?subtab quand on revient sur 'today'", () => {
    currentSearch = 'tab=courses&subtab=agenda'
    const { result } = renderHook(() => useDriverCoursesScreen())
    act(() => { result.current.setActive('today') })
    expect(mockPush).toHaveBeenCalledWith('/dashboard/chauffeur?tab=courses')
  })
})

describe('useDriverCoursesScreen — subTabs + badge', () => {
  it("subTabs contient 4 entrées (Aujourd'hui, Agenda, Annonces, Stats)", () => {
    const { result } = renderHook(() => useDriverCoursesScreen())
    expect(result.current.subTabs).toHaveLength(4)
    expect(result.current.subTabs.map((t) => t.id)).toEqual(['today', 'agenda', 'ads', 'stats'])
  })

  it('dateLabel est une chaine non vide', () => {
    const { result } = renderHook(() => useDriverCoursesScreen())
    expect(result.current.dateLabel).toBeTruthy()
  })

  it("sous-onglet 'ads' porte badge=N quand il y a N acceptation(s) non vue(s)", () => {
    seedUnseen('m1')
    seedUnseen('m2')
    const { result } = renderHook(() => useDriverCoursesScreen())
    const ads = result.current.subTabs.find((t) => t.id === 'ads')
    expect(ads?.badge).toBe(2)
    expect(result.current.postedBadge).toBe(2)
  })
})

describe('useDriverCoursesScreen — effets sur acceptations non vues', () => {
  it("setActive('ads') vide les acceptations non vues", () => {
    seedUnseen('m1')
    const { result } = renderHook(() => useDriverCoursesScreen())
    act(() => { result.current.setActive('ads') })
    expect(Object.keys(usePostedAcceptStore.getState().unseen)).toHaveLength(0)
  })

  it("setActive('agenda') ne vide pas les acceptations non vues", () => {
    seedUnseen('m1')
    const { result } = renderHook(() => useDriverCoursesScreen())
    act(() => { result.current.setActive('agenda') })
    expect(usePostedAcceptStore.getState().unseen['m1']).toBeTruthy()
  })

  it("arriver deja sur ?subtab=ads avec des unseen les vide", () => {
    seedUnseen('m1')
    currentSearch = 'tab=courses&subtab=ads'
    renderHook(() => useDriverCoursesScreen())
    expect(Object.keys(usePostedAcceptStore.getState().unseen)).toHaveLength(0)
  })
})
