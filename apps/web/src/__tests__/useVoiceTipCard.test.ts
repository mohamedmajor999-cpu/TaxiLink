import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useVoiceTipCard } from '@/components/dashboard/driver/useVoiceTipCard'

const KEY = 'taxilink.voice.tip'

function makeLocalStorage() {
  let store: Record<string, string> = {}
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v },
    removeItem: (k: string) => { delete store[k] },
    clear: () => { store = {} },
  }
}

let lsMock: ReturnType<typeof makeLocalStorage>

beforeEach(() => {
  lsMock = makeLocalStorage()
  vi.stubGlobal('localStorage', lsMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useVoiceTipCard', () => {
  it('visible=true par défaut (localStorage vide)', async () => {
    const { result } = renderHook(() => useVoiceTipCard())
    await waitFor(() => expect(result.current.visible).toBe(true))
  })

  it('visible=false si localStorage contient "hidden"', async () => {
    lsMock.setItem(KEY, 'hidden')
    const { result } = renderHook(() => useVoiceTipCard())
    await waitFor(() => expect(result.current.visible).toBe(false))
  })

  it('hide() passe visible à false et écrit localStorage', async () => {
    const { result } = renderHook(() => useVoiceTipCard())
    await waitFor(() => expect(result.current.visible).toBe(true))
    act(() => { result.current.hide() })
    expect(result.current.visible).toBe(false)
    expect(lsMock.getItem(KEY)).toBe('hidden')
  })

  it('show() passe visible à true et supprime localStorage', async () => {
    lsMock.setItem(KEY, 'hidden')
    const { result } = renderHook(() => useVoiceTipCard())
    await waitFor(() => expect(result.current.visible).toBe(false))
    act(() => { result.current.show() })
    expect(result.current.visible).toBe(true)
    expect(lsMock.getItem(KEY)).toBeNull()
  })
})
