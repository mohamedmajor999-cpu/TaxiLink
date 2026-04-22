import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { Group } from '@taxilink/core'

const groups: Group[] = [
  { id: 'g1', name: 'Ambulance Lyon', description: 'Groupe Lyon', createdBy: 'u1' } as Group,
  { id: 'g2', name: 'VSL Paris', description: null, createdBy: 'u2' } as Group,
]

vi.mock('@/components/dashboard/driver/useDriverGroupes', () => ({
  useDriverGroupes: () => ({
    groups,
    loading: false,
    error: null,
    isAdmin: vi.fn(),
  }),
}))

describe('useDriverGroupesScreen', () => {
  it('filteredGroups retourne tous les groupes par défaut', async () => {
    const { useDriverGroupesScreen } = await import('@/components/dashboard/driver/useDriverGroupesScreen')
    const { result } = renderHook(() => useDriverGroupesScreen())
    expect(result.current.filteredGroups).toHaveLength(2)
  })

  it('query filtre par nom', async () => {
    const { useDriverGroupesScreen } = await import('@/components/dashboard/driver/useDriverGroupesScreen')
    const { result } = renderHook(() => useDriverGroupesScreen())
    act(() => { result.current.setQuery('lyon') })
    expect(result.current.filteredGroups).toHaveLength(1)
    expect(result.current.filteredGroups[0].id).toBe('g1')
  })

  it('query vide retourne tous les groupes', async () => {
    const { useDriverGroupesScreen } = await import('@/components/dashboard/driver/useDriverGroupesScreen')
    const { result } = renderHook(() => useDriverGroupesScreen())
    act(() => { result.current.setQuery('vsl') })
    act(() => { result.current.setQuery('') })
    expect(result.current.filteredGroups).toHaveLength(2)
  })

  it('query filtre aussi par description', async () => {
    const { useDriverGroupesScreen } = await import('@/components/dashboard/driver/useDriverGroupesScreen')
    const { result } = renderHook(() => useDriverGroupesScreen())
    act(() => { result.current.setQuery('groupe') })
    expect(result.current.filteredGroups).toHaveLength(1)
    expect(result.current.filteredGroups[0].id).toBe('g1')
  })
})
