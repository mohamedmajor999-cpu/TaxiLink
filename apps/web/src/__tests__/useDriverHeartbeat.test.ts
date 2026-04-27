import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

const mockHeartbeat = vi.fn()
vi.mock('@/services/driverService', () => ({
  driverService: { heartbeat: (...a: unknown[]) => mockHeartbeat(...a) },
}))

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}))

const { fakeUseDriverStore } = vi.hoisted(() => ({ fakeUseDriverStore: vi.fn() }))
vi.mock('@/store/driverStore', () => ({ useDriverStore: fakeUseDriverStore }))

import { useDriverHeartbeat } from '@/hooks/useDriverHeartbeat'

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  mockHeartbeat.mockResolvedValue(undefined)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useDriverHeartbeat', () => {
  it('ne ping pas si driverId vide', () => {
    fakeUseDriverStore.mockImplementation((sel: any) => sel({ driver: { id: '', isOnline: true } }))
    renderHook(() => useDriverHeartbeat())
    expect(mockHeartbeat).not.toHaveBeenCalled()
  })

  it('ne ping pas si isOnline=false', () => {
    fakeUseDriverStore.mockImplementation((sel: any) => sel({ driver: { id: 'drv-1', isOnline: false } }))
    renderHook(() => useDriverHeartbeat())
    expect(mockHeartbeat).not.toHaveBeenCalled()
  })

  it('ping immediatement au mount quand driver online', () => {
    fakeUseDriverStore.mockImplementation((sel: any) => sel({ driver: { id: 'drv-1', isOnline: true } }))
    renderHook(() => useDriverHeartbeat())
    expect(mockHeartbeat).toHaveBeenCalledWith('drv-1')
    expect(mockHeartbeat).toHaveBeenCalledTimes(1)
  })

  it('reping toutes les 60 secondes', () => {
    fakeUseDriverStore.mockImplementation((sel: any) => sel({ driver: { id: 'drv-1', isOnline: true } }))
    renderHook(() => useDriverHeartbeat())
    expect(mockHeartbeat).toHaveBeenCalledTimes(1)
    act(() => { vi.advanceTimersByTime(60_000) })
    expect(mockHeartbeat).toHaveBeenCalledTimes(2)
    act(() => { vi.advanceTimersByTime(60_000) })
    expect(mockHeartbeat).toHaveBeenCalledTimes(3)
  })

  it('arrete le ping au unmount', () => {
    fakeUseDriverStore.mockImplementation((sel: any) => sel({ driver: { id: 'drv-1', isOnline: true } }))
    const { unmount } = renderHook(() => useDriverHeartbeat())
    expect(mockHeartbeat).toHaveBeenCalledTimes(1)
    unmount()
    act(() => { vi.advanceTimersByTime(120_000) })
    expect(mockHeartbeat).toHaveBeenCalledTimes(1)
  })

  it('swallow les erreurs de heartbeat (best-effort)', async () => {
    fakeUseDriverStore.mockImplementation((sel: any) => sel({ driver: { id: 'drv-1', isOnline: true } }))
    mockHeartbeat.mockRejectedValueOnce(new Error('reseau down'))
    expect(() => renderHook(() => useDriverHeartbeat())).not.toThrow()
  })
})
