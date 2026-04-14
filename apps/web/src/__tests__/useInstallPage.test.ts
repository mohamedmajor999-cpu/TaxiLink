import { describe, it, expect } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useInstallPage } from '@/components/install/useInstallPage'

describe('useInstallPage — appUrl', () => {
  it('met a jour appUrl avec window.location.origin au montage', async () => {
    const { result } = renderHook(() => useInstallPage())
    await waitFor(() => expect(result.current.appUrl).toBe(window.location.origin))
  })
})

describe('useInstallPage — activeTab', () => {
  it('demarre sur ios', () => {
    const { result } = renderHook(() => useInstallPage())
    expect(result.current.activeTab).toBe('ios')
  })

  it('setActiveTab bascule sur android', () => {
    const { result } = renderHook(() => useInstallPage())
    act(() => { result.current.setActiveTab('android') })
    expect(result.current.activeTab).toBe('android')
  })
})
