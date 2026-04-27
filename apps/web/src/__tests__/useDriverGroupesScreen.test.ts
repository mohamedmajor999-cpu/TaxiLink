import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { Group } from '@taxilink/core'

const groups: Group[] = [
  { id: 'g1', name: 'Ambulance Lyon', description: 'Groupe Lyon', createdBy: 'u1' } as Group,
  { id: 'g2', name: 'VSL Paris', description: null, createdBy: 'u2' } as Group,
]

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: vi.fn() }),
}))

vi.mock('@/components/dashboard/driver/useDriverGroupes', () => ({
  useDriverGroupes: () => ({
    groups,
    loading: false,
    error: null,
    isAdmin: vi.fn(),
  }),
}))

vi.mock('@/services/groupStatsService', () => ({
  groupStatsService: {
    getActivitySummary: vi.fn().mockResolvedValue({
      available: 0, exchanged7d: 0, reprisePercent: 0, onlineCount: 0,
    }),
  },
}))

// Le hook s'abonne maintenant à un canal Supabase realtime au mount.
// On mock createClient pour que les tests d'unité ne dépendent pas
// d'une session Supabase réelle.
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    channel: () => ({
      on: function () { return this },
      subscribe: vi.fn(),
    }),
    removeChannel: vi.fn(),
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

  it('openGroup navigue vers /dashboard/chauffeur/groupe/[id]', async () => {
    mockPush.mockClear()
    const { useDriverGroupesScreen } = await import('@/components/dashboard/driver/useDriverGroupesScreen')
    const { result } = renderHook(() => useDriverGroupesScreen())
    act(() => { result.current.openGroup(groups[0]) })
    expect(mockPush).toHaveBeenCalledWith('/dashboard/chauffeur/groupe/g1')
  })
})
