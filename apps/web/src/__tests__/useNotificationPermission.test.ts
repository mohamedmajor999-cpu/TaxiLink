import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useNotificationPermission } from '@/hooks/useNotificationPermission'

let permissionState: NotificationPermission = 'default'
let requestImpl: () => Promise<NotificationPermission> = async () => permissionState

class MockNotification {
  static get permission() { return permissionState }
  static requestPermission(): Promise<NotificationPermission> {
    return requestImpl()
  }
}

beforeEach(() => {
  permissionState = 'default'
  requestImpl = async () => permissionState
  ;(globalThis as unknown as { Notification: typeof MockNotification }).Notification = MockNotification
})

afterEach(() => {
  delete (globalThis as unknown as { Notification?: unknown }).Notification
})

describe('useNotificationPermission', () => {
  it("expose la permission courante au montage", async () => {
    permissionState = 'granted'
    const { result } = renderHook(() => useNotificationPermission())
    await waitFor(() => expect(result.current.permission).toBe('granted'))
    expect(result.current.supported).toBe(true)
  })

  it("retourne 'unsupported' si Notification est absent", async () => {
    delete (globalThis as unknown as { Notification?: unknown }).Notification
    const { result } = renderHook(() => useNotificationPermission())
    await waitFor(() => expect(result.current.permission).toBe('unsupported'))
    expect(result.current.supported).toBe(false)
  })

  it("request() declenche le prompt et met a jour la permission si granted", async () => {
    permissionState = 'default'
    requestImpl = async () => {
      permissionState = 'granted'
      return 'granted'
    }
    const { result } = renderHook(() => useNotificationPermission())
    await waitFor(() => expect(result.current.permission).toBe('default'))
    let resolved: NotificationPermission | 'unsupported' = 'default'
    await act(async () => { resolved = await result.current.request() })
    expect(resolved).toBe('granted')
    expect(result.current.permission).toBe('granted')
  })

  it("request() ne re-prompt pas si deja denied", async () => {
    permissionState = 'denied'
    let promptCalled = false
    requestImpl = async () => { promptCalled = true; return 'denied' }
    const { result } = renderHook(() => useNotificationPermission())
    await waitFor(() => expect(result.current.permission).toBe('denied'))
    await act(async () => { await result.current.request() })
    expect(promptCalled).toBe(false)
    expect(result.current.permission).toBe('denied')
  })

  it("request() retourne 'unsupported' si l'API n'existe pas", async () => {
    delete (globalThis as unknown as { Notification?: unknown }).Notification
    const { result } = renderHook(() => useNotificationPermission())
    let resolved: NotificationPermission | 'unsupported' = 'default'
    await act(async () => { resolved = await result.current.request() })
    expect(resolved).toBe('unsupported')
  })
})
