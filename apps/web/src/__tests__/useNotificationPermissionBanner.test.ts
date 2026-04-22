import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useNotificationPermissionBanner } from '@/components/taxilink/useNotificationPermissionBanner'

describe('useNotificationPermissionBanner', () => {
  it('dismissed=false par défaut', () => {
    const { result } = renderHook(() => useNotificationPermissionBanner())
    expect(result.current.dismissed).toBe(false)
  })

  it('dismiss() passe dismissed à true', () => {
    const { result } = renderHook(() => useNotificationPermissionBanner())
    act(() => { result.current.dismiss() })
    expect(result.current.dismissed).toBe(true)
  })
})
