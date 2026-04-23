import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGroupActions } from '@/components/dashboard/driver/useGroupActions'
import type { Group } from '@taxilink/core'

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockCreate = vi.fn()
const mockJoin   = vi.fn()
const mockLeave  = vi.fn()
const mockDelete = vi.fn()
const mockPush   = vi.fn()
const mockBack   = vi.fn()
let currentSearch = ''

vi.mock('next/navigation', () => ({
  useRouter:       () => ({ push: mockPush, back: mockBack }),
  usePathname:     () => '/dashboard/chauffeur',
  useSearchParams: () => new URLSearchParams(currentSearch),
}))

vi.mock('@/services/groupService', () => ({
  groupService: {
    create:      (...a: unknown[]) => mockCreate(...a),
    join:        (...a: unknown[]) => mockJoin(...a),
    leave:       (...a: unknown[]) => mockLeave(...a),
    deleteGroup: (...a: unknown[]) => mockDelete(...a),
  },
}))

const fakeGroup: Group = {
  id: 'g1', name: 'Taxi 95', description: null,
  createdBy: 'd1', createdAt: '2026-01-01', memberCount: 1,
}

beforeEach(() => {
  vi.clearAllMocks()
  currentSearch = ''
  mockCreate.mockResolvedValue(fakeGroup)
  mockJoin.mockResolvedValue(undefined)
  mockLeave.mockResolvedValue(undefined)
  mockDelete.mockResolvedValue(undefined)
})

// ─── Création ─────────────────────────────────────────────────────────────────
describe('useGroupActions — handleCreate', () => {
  it('appelle groupService.create et ajoute le groupe via setGroups', async () => {
    const setGroups  = vi.fn()
    const loadGroups = vi.fn().mockResolvedValue(undefined)
    const setError   = vi.fn()
    const { result } = renderHook(() =>
      useGroupActions({ driverId: 'd1', setGroups, loadGroups, setError })
    )
    act(() => { result.current.setNewName('Taxi 95') })
    await act(async () => { await result.current.handleCreate() })
    expect(mockCreate).toHaveBeenCalledWith('Taxi 95', null, 'd1')
    expect(setGroups).toHaveBeenCalled()
    expect(result.current.showCreate).toBe(false)
  })
})

// ─── Rejoindre ────────────────────────────────────────────────────────────────
describe('useGroupActions — handleJoin', () => {
  it('appelle groupService.join et recharge les groupes', async () => {
    const setGroups  = vi.fn()
    const loadGroups = vi.fn().mockResolvedValue(undefined)
    const setError   = vi.fn()
    const { result } = renderHook(() =>
      useGroupActions({ driverId: 'd1', setGroups, loadGroups, setError })
    )
    act(() => { result.current.setJoinId('g2') })
    await act(async () => { await result.current.handleJoin() })
    expect(mockJoin).toHaveBeenCalledWith('g2', 'd1')
    expect(loadGroups).toHaveBeenCalled()
    expect(result.current.showJoin).toBe(false)
  })
})

// ─── Quitter / Supprimer ──────────────────────────────────────────────────────
describe('useGroupActions — handleLeave', () => {
  it('appelle groupService.leave et filtre le groupe de la liste', async () => {
    const setGroups  = vi.fn()
    const loadGroups = vi.fn().mockResolvedValue(undefined)
    const setError   = vi.fn()
    const { result } = renderHook(() =>
      useGroupActions({ driverId: 'd1', setGroups, loadGroups, setError })
    )
    await act(async () => { await result.current.handleLeave('g1') })
    expect(mockLeave).toHaveBeenCalledWith('g1', 'd1')
    expect(setGroups).toHaveBeenCalled()
  })
})

describe('useGroupActions — handleDelete', () => {
  it('appelle groupService.deleteGroup et filtre le groupe de la liste', async () => {
    const setGroups  = vi.fn()
    const loadGroups = vi.fn().mockResolvedValue(undefined)
    const setError   = vi.fn()
    const { result } = renderHook(() =>
      useGroupActions({ driverId: 'd1', setGroups, loadGroups, setError })
    )
    await act(async () => { await result.current.handleDelete('g1') })
    expect(mockDelete).toHaveBeenCalledWith('g1')
    expect(setGroups).toHaveBeenCalled()
  })
})

// ─── Modals URL-syncro ────────────────────────────────────────────────────────
describe('useGroupActions — modals URL-syncro', () => {
  const makeArgs = () => ({
    driverId: 'd1',
    setGroups: vi.fn(),
    loadGroups: vi.fn().mockResolvedValue(undefined),
    setError: vi.fn(),
  })

  it('showCreate reflete ?modal=creer-groupe', () => {
    currentSearch = 'modal=creer-groupe'
    const { result } = renderHook(() => useGroupActions(makeArgs()))
    expect(result.current.showCreate).toBe(true)
    expect(result.current.showJoin).toBe(false)
  })

  it('showJoin reflete ?modal=rejoindre-groupe', () => {
    currentSearch = 'modal=rejoindre-groupe'
    const { result } = renderHook(() => useGroupActions(makeArgs()))
    expect(result.current.showJoin).toBe(true)
    expect(result.current.showCreate).toBe(false)
  })

  it('setShowCreate(true) push ?modal=creer-groupe', () => {
    const { result } = renderHook(() => useGroupActions(makeArgs()))
    act(() => { result.current.setShowCreate(true) })
    expect(mockPush).toHaveBeenCalledWith('/dashboard/chauffeur?modal=creer-groupe')
  })

  it('setShowCreate(false) appelle router.back()', () => {
    currentSearch = 'modal=creer-groupe'
    const { result } = renderHook(() => useGroupActions(makeArgs()))
    act(() => { result.current.setShowCreate(false) })
    expect(mockBack).toHaveBeenCalled()
  })
})
