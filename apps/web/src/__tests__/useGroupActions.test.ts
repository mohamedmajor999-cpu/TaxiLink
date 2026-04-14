import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGroupActions } from '@/components/dashboard/driver/useGroupActions'
import type { Group } from '@taxilink/core'

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockCreate = vi.fn()
const mockJoin   = vi.fn()
const mockLeave  = vi.fn()
const mockDelete = vi.fn()

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
