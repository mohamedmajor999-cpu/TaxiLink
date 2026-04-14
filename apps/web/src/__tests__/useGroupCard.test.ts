import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGroupCard } from '@/components/dashboard/driver/useGroupCard'
import type { Group } from '@taxilink/core'

// ─── Mocks globals ────────────────────────────────────────────────────────────
const mockWriteText = vi.fn().mockResolvedValue(undefined)
const mockOpen      = vi.fn()

const fakeGroup: Group = {
  id: 'g1', name: 'Taxi 95', description: null,
  createdBy: 'd1', createdAt: '2026-01-01', memberCount: 2,
}

beforeEach(() => {
  vi.clearAllMocks()
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: mockWriteText },
    configurable: true,
    writable: true,
  })
  vi.stubGlobal('open', mockOpen)
})

// ─── Menu ─────────────────────────────────────────────────────────────────────
describe('useGroupCard — menu', () => {
  it('setMenuOpen ouvre et ferme le menu', () => {
    const { result } = renderHook(() => useGroupCard(fakeGroup))
    act(() => { result.current.setMenuOpen(true) })
    expect(result.current.menuOpen).toBe(true)
    act(() => { result.current.setMenuOpen(false) })
    expect(result.current.menuOpen).toBe(false)
  })
})

// ─── copyId ───────────────────────────────────────────────────────────────────
describe('useGroupCard — copyId', () => {
  it('copie lID du groupe et passe copied a true', async () => {
    const { result } = renderHook(() => useGroupCard(fakeGroup))
    await act(async () => { await result.current.copyId() })
    expect(mockWriteText).toHaveBeenCalledWith('g1')
    expect(result.current.copied).toBe(true)
    expect(result.current.menuOpen).toBe(false)
  })
})

// ─── pendingAction ────────────────────────────────────────────────────────────
describe('useGroupCard — pendingAction', () => {
  it('triggerDelete positionne pendingAction a delete', () => {
    const { result } = renderHook(() => useGroupCard(fakeGroup))
    act(() => { result.current.triggerDelete() })
    expect(result.current.pendingAction).toBe('delete')
    expect(result.current.menuOpen).toBe(false)
  })

  it('triggerLeave positionne pendingAction a leave', () => {
    const { result } = renderHook(() => useGroupCard(fakeGroup))
    act(() => { result.current.triggerLeave() })
    expect(result.current.pendingAction).toBe('leave')
  })

  it('cancelAction remet pendingAction a null', () => {
    const { result } = renderHook(() => useGroupCard(fakeGroup))
    act(() => { result.current.triggerDelete() })
    act(() => { result.current.cancelAction() })
    expect(result.current.pendingAction).toBeNull()
  })
})
