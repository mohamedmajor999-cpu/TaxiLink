import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useGroupStats } from '@/components/dashboard/driver/useGroupStats'
import type { Group, GroupMemberStats } from '@taxilink/core'

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockGetMemberStats = vi.fn()

vi.mock('@/services/groupStatsService', () => ({
  groupStatsService: {
    getMemberStats: (...a: unknown[]) => mockGetMemberStats(...a),
  },
}))

const fakeGroup: Group = {
  id: 'g1', name: 'Taxi 95', description: null,
  createdBy: 'd1', createdAt: '2026-01-01', memberCount: 2,
}
const fakeStats: GroupMemberStats[] = [
  { driverId: 'd1', fullName: 'Marc Dupont', firstName: 'Marc', lastName: 'Dupont', department: '95', isOnline: true, role: 'admin', sharedCount: 5, acceptedCount: 3 },
]

beforeEach(() => {
  vi.clearAllMocks()
  mockGetMemberStats.mockResolvedValue(fakeStats)
})

// ─── openMembers ──────────────────────────────────────────────────────────────
describe('useGroupStats — openMembers', () => {
  it('charge les stats du groupe apres openMembers', async () => {
    const { result } = renderHook(() => useGroupStats())
    act(() => { result.current.openMembers(fakeGroup) })
    await waitFor(() => expect(result.current.statsLoading).toBe(false))
    expect(result.current.memberStats).toHaveLength(1)
    expect(result.current.selectedGroup?.id).toBe('g1')
  })
})

// ─── closeMembers ─────────────────────────────────────────────────────────────
describe('useGroupStats — closeMembers', () => {
  it('remet selectedGroup a null', async () => {
    const { result } = renderHook(() => useGroupStats())
    act(() => { result.current.openMembers(fakeGroup) })
    await waitFor(() => expect(result.current.statsLoading).toBe(false))
    act(() => { result.current.closeMembers() })
    expect(result.current.selectedGroup).toBeNull()
  })
})

// ─── statsPeriod ──────────────────────────────────────────────────────────────
describe('useGroupStats — statsPeriod', () => {
  it('recharge les stats quand statsPeriod change', async () => {
    const { result } = renderHook(() => useGroupStats())
    act(() => { result.current.openMembers(fakeGroup) })
    await waitFor(() => expect(result.current.statsLoading).toBe(false))
    act(() => { result.current.setStatsPeriod('week') })
    await waitFor(() => expect(result.current.statsLoading).toBe(false))
    expect(mockGetMemberStats).toHaveBeenCalledTimes(2)
  })
})
