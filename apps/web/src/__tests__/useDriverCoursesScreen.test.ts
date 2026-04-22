import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDriverCoursesScreen } from '@/components/dashboard/driver/courses/useDriverCoursesScreen'
import { usePostedAcceptStore } from '@/store/postedAcceptStore'

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

describe('useDriverCoursesScreen', () => {
  beforeEach(() => {
    usePostedAcceptStore.getState().reset()
  })


  it("onglet actif par défaut = 'upcoming'", () => {
    const { result } = renderHook(() => useDriverCoursesScreen())
    expect(result.current.active).toBe('upcoming')
  })

  it('setActive change onglet actif', () => {
    const { result } = renderHook(() => useDriverCoursesScreen())
    act(() => { result.current.setActive('history') })
    expect(result.current.active).toBe('history')
  })

  it('subTabs contient 4 entrées', () => {
    const { result } = renderHook(() => useDriverCoursesScreen())
    expect(result.current.subTabs).toHaveLength(4)
  })

  it('dateLabel est une chaîne non vide', () => {
    const { result } = renderHook(() => useDriverCoursesScreen())
    expect(result.current.dateLabel).toBeTruthy()
    expect(typeof result.current.dateLabel).toBe('string')
  })

  it("subTabs inclut 'agenda' et 'posted'", () => {
    const { result } = renderHook(() => useDriverCoursesScreen())
    const ids = result.current.subTabs.map((t) => t.id)
    expect(ids).toContain('agenda')
    expect(ids).toContain('posted')
  })

  it("sous-onglet 'Postées' porte badge=N quand il y a N acceptation(s) non vue(s)", () => {
    seedUnseen('m1')
    seedUnseen('m2')
    const { result } = renderHook(() => useDriverCoursesScreen())
    const posted = result.current.subTabs.find((t) => t.id === 'posted')
    expect(posted?.badge).toBe(2)
    expect(result.current.postedBadge).toBe(2)
  })

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

  it("l'event window 'taxilink:open-posted-tab' bascule sur 'posted'", () => {
    const { result } = renderHook(() => useDriverCoursesScreen())
    act(() => { window.dispatchEvent(new CustomEvent('taxilink:open-posted-tab')) })
    expect(result.current.active).toBe('posted')
  })
})
