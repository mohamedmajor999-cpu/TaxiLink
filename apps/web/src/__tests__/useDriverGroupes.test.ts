import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useDriverGroupes } from '@/components/dashboard/driver/useDriverGroupes'

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockGetMyGroups = vi.fn()
const mockGetMembers  = vi.fn()
const mockCreate      = vi.fn()
const mockJoin        = vi.fn()
const mockLeave       = vi.fn()
const mockDeleteGroup = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter:       () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname:     () => '/dashboard/chauffeur',
  useSearchParams: () => new URLSearchParams(''),
}))

// Mock Supabase client (real-time channel)
const mockSubscribe        = vi.fn().mockReturnValue({})
const mockOn               = vi.fn()
const mockChannelInstance  = { on: mockOn, subscribe: mockSubscribe }
const mockChannel          = vi.fn().mockReturnValue(mockChannelInstance)
const mockRemoveChannel    = vi.fn()
mockOn.mockReturnValue(mockChannelInstance)

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ channel: mockChannel, removeChannel: mockRemoveChannel }),
}))

vi.mock('@/services/groupStatsService', () => ({
  groupStatsService: {
    getMemberStats: vi.fn().mockResolvedValue([]),
  },
}))

vi.mock('@/services/groupService', () => ({
  groupService: {
    getMyGroups:  (...a: unknown[]) => mockGetMyGroups(...a),
    getMembers:   (...a: unknown[]) => mockGetMembers(...a),
    create:       (...a: unknown[]) => mockCreate(...a),
    join:         (...a: unknown[]) => mockJoin(...a),
    leave:        (...a: unknown[]) => mockLeave(...a),
    deleteGroup:  (...a: unknown[]) => mockDeleteGroup(...a),
  },
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'drv-1', email: 'test@test.com' } }),
}))

const group1 = { id: 'g1', name: 'Groupe A', description: null, createdBy: 'drv-1', createdAt: '2026-01-01' }
const group2 = { id: 'g2', name: 'Groupe B', description: null, createdBy: 'drv-2', createdAt: '2026-01-02' }

beforeEach(() => {
  vi.clearAllMocks()
  mockGetMyGroups.mockResolvedValue([group1])
})

// ─── Chargement initial ───────────────────────────────────────────────────────
describe('useDriverGroupes — chargement', () => {
  it('charge les groupes au montage', async () => {
    const { result } = renderHook(() => useDriverGroupes())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.groups).toEqual([group1])
  })

  it('affiche une erreur si le chargement echoue', async () => {
    mockGetMyGroups.mockRejectedValue(new Error('reseau'))
    const { result } = renderHook(() => useDriverGroupes())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('Impossible de charger vos groupes')
  })
})

// ─── Creer un groupe ──────────────────────────────────────────────────────────
describe('useDriverGroupes — handleCreate', () => {
  it('ajoute le groupe cree en tete de liste', async () => {
    mockCreate.mockResolvedValue(group2)
    const { result } = renderHook(() => useDriverGroupes())
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => { result.current.setNewName('Groupe B') })
    await act(async () => { await result.current.handleCreate() })

    expect(result.current.groups[0]).toEqual(group2)
    expect(result.current.showCreate).toBe(false)
  })

  it('affiche une erreur si la creation echoue', async () => {
    mockCreate.mockRejectedValue(new Error('RLS'))
    const { result } = renderHook(() => useDriverGroupes())
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => { result.current.setNewName('Test') })
    await act(async () => { await result.current.handleCreate() })

    expect(result.current.error).toContain('Erreur')
  })
})

// ─── Quitter un groupe ────────────────────────────────────────────────────────
describe('useDriverGroupes — handleLeave', () => {
  it('retire le groupe de la liste apres avoir quitte', async () => {
    mockGetMyGroups.mockResolvedValue([group1, group2])
    mockLeave.mockResolvedValue(undefined)
    const { result } = renderHook(() => useDriverGroupes())
    await waitFor(() => expect(result.current.groups).toHaveLength(2))

    await act(async () => { await result.current.handleLeave('g2') })

    expect(result.current.groups.find((g) => g.id === 'g2')).toBeUndefined()
  })
})

// ─── isAdmin ──────────────────────────────────────────────────────────────────
describe('useDriverGroupes — isAdmin', () => {
  it('retourne true si le chauffeur est createur', async () => {
    const { result } = renderHook(() => useDriverGroupes())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.isAdmin(group1)).toBe(true)
  })

  it('retourne false si le chauffeur nest pas createur', async () => {
    const { result } = renderHook(() => useDriverGroupes())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.isAdmin(group2)).toBe(false)
  })
})
