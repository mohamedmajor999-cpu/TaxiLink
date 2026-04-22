import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDriverCoursesScreen } from '@/components/dashboard/driver/courses/useDriverCoursesScreen'

describe('useDriverCoursesScreen', () => {
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
})
