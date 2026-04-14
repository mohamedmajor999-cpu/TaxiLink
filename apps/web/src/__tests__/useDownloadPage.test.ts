import { describe, it, expect } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useDownloadPage } from '@/components/install/useDownloadPage'

describe('useDownloadPage — appUrl', () => {
  it('met a jour appUrl avec window.location.origin au montage', async () => {
    const { result } = renderHook(() => useDownloadPage())
    await waitFor(() => expect(result.current.appUrl).toBe(window.location.origin))
  })
})

describe('useDownloadPage — activeOs', () => {
  it('demarre sur ios', () => {
    const { result } = renderHook(() => useDownloadPage())
    expect(result.current.activeOs).toBe('ios')
  })

  it('setActiveOs bascule sur android', () => {
    const { result } = renderHook(() => useDownloadPage())
    act(() => { result.current.setActiveOs('android') })
    expect(result.current.activeOs).toBe('android')
  })
})
