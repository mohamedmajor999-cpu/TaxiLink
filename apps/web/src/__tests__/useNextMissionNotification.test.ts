import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useNextMissionNotification } from '@/hooks/useNextMissionNotification'
import type { Mission } from '@/lib/supabase/types'

function makeMission(scheduledAt: string): Mission {
  return {
    id: 'm1', scheduled_at: scheduledAt,
    departure: 'Paris', destination: 'Lyon',
  } as unknown as Mission
}

function primeNotification(permission: NotificationPermission = 'default') {
  const NotifMock = Object.assign(vi.fn(), {
    permission,
    requestPermission: vi.fn().mockResolvedValue('granted' as NotificationPermission),
  })
  vi.stubGlobal('Notification', NotifMock)
  return NotifMock
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-05-01T10:00:00.000Z'))
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

// ─── Permission initiale ──────────────────────────────────────────────────────
describe('useNextMissionNotification — permission initiale', () => {
  it("retourne 'default' si Notification.permission est 'default'", () => {
    primeNotification('default')
    const { result } = renderHook(() => useNextMissionNotification(null))
    expect(result.current.permission).toBe('default')
  })

  it("retourne 'granted' si Notification.permission est 'granted'", () => {
    primeNotification('granted')
    const { result } = renderHook(() => useNextMissionNotification(null))
    expect(result.current.permission).toBe('granted')
  })

  it("retourne 'unsupported' si Notification n'est pas disponible", () => {
    vi.stubGlobal('Notification', undefined)
    const { result } = renderHook(() => useNextMissionNotification(null))
    expect(result.current.permission).toBe('unsupported')
  })
})

// ─── requestPermission ────────────────────────────────────────────────────────
describe('useNextMissionNotification — requestPermission', () => {
  it("appelle Notification.requestPermission et met à jour permission", async () => {
    primeNotification('default')
    const { result } = renderHook(() => useNextMissionNotification(null))
    expect(result.current.permission).toBe('default')

    await act(async () => {
      await result.current.requestPermission()
    })
    expect(result.current.permission).toBe('granted')
  })

  it("retourne 'unsupported' si Notification absent", async () => {
    vi.stubGlobal('Notification', undefined)
    const { result } = renderHook(() => useNextMissionNotification(null))
    const perm = await result.current.requestPermission()
    expect(perm).toBe('unsupported')
  })
})

// ─── Timer de notification ────────────────────────────────────────────────────
describe('useNextMissionNotification — timer', () => {
  it('crée une Notification 15 min avant le départ', async () => {
    const NotifMock = primeNotification('granted')
    // Mission dans 20 min → notification doit s'allumer à 10:05 (5 min = 300 000ms)
    const mission = makeMission('2026-05-01T10:20:00.000Z')
    renderHook(() => useNextMissionNotification(mission))

    act(() => { vi.advanceTimersByTime(300_000) })
    expect(NotifMock).toHaveBeenCalledWith(
      'Course dans 15 min',
      expect.objectContaining({ body: 'Paris → Lyon' }),
    )
  })

  it("ne crée pas de notification si mission est null", () => {
    const NotifMock = primeNotification('granted')
    renderHook(() => useNextMissionNotification(null))
    act(() => { vi.advanceTimersByTime(3_600_000) })
    expect(NotifMock).not.toHaveBeenCalled()
  })

  it("ne crée pas de notification si permission n'est pas 'granted'", () => {
    const NotifMock = primeNotification('default')
    const mission = makeMission('2026-05-01T10:20:00.000Z')
    renderHook(() => useNextMissionNotification(mission))
    act(() => { vi.advanceTimersByTime(3_600_000) })
    expect(NotifMock).not.toHaveBeenCalled()
  })
})
