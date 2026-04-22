import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useInstallSection } from '@/components/site/useInstallSection'

describe('useInstallSection', () => {
  it('retourne window.location.origin comme appUrl', async () => {
    const { result } = renderHook(() => useInstallSection())
    await waitFor(() => {
      expect(result.current.appUrl).toBe(window.location.origin)
    })
  })
})
