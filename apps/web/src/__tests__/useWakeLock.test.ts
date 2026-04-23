import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useWakeLock } from '@/hooks/useWakeLock'

let mockRequest: ReturnType<typeof vi.fn>
let mockRelease: ReturnType<typeof vi.fn>
let releaseHandlers: Array<() => void>

function installWakeLockMock() {
  releaseHandlers = []
  mockRelease = vi.fn().mockResolvedValue(undefined)
  mockRequest = vi.fn().mockImplementation(async () => ({
    released: false,
    release: mockRelease,
    addEventListener: (event: string, handler: () => void) => {
      if (event === 'release') releaseHandlers.push(handler)
    },
  }))
  Object.defineProperty(navigator, 'wakeLock', {
    value: { request: mockRequest },
    configurable: true,
  })
}

function uninstallWakeLockMock() {
  Object.defineProperty(navigator, 'wakeLock', { value: undefined, configurable: true })
}

beforeEach(() => {
  installWakeLockMock()
})

afterEach(() => {
  uninstallWakeLockMock()
})

describe('useWakeLock', () => {
  it('acquire appelle wakeLock.request("screen")', async () => {
    const { result } = renderHook(() => useWakeLock())
    await act(async () => { await result.current.acquire() })
    expect(mockRequest).toHaveBeenCalledWith('screen')
  })

  it('release libère le sentinel actif', async () => {
    const { result } = renderHook(() => useWakeLock())
    await act(async () => { await result.current.acquire() })
    await act(async () => { await result.current.release() })
    expect(mockRelease).toHaveBeenCalled()
  })

  it('ne ré-acquiert pas si un lock est déjà actif', async () => {
    const { result } = renderHook(() => useWakeLock())
    await act(async () => { await result.current.acquire() })
    await act(async () => { await result.current.acquire() })
    expect(mockRequest).toHaveBeenCalledTimes(1)
  })

  it('no-op silencieux si wakeLock API absente', async () => {
    uninstallWakeLockMock()
    const { result } = renderHook(() => useWakeLock())
    await expect(
      act(async () => { await result.current.acquire() }),
    ).resolves.not.toThrow()
  })

  it('ré-acquiert quand l\'onglet redevient visible si encore voulu', async () => {
    const { result } = renderHook(() => useWakeLock())
    await act(async () => { await result.current.acquire() })
    // Simule relâche automatique du navigateur quand la page devient cachée
    act(() => { releaseHandlers.forEach((h) => h()) })
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
    act(() => { document.dispatchEvent(new Event('visibilitychange')) })
    await waitFor(() => expect(mockRequest).toHaveBeenCalledTimes(2))
  })

  it('libère au démontage', async () => {
    const { result, unmount } = renderHook(() => useWakeLock())
    await act(async () => { await result.current.acquire() })
    unmount()
    await waitFor(() => expect(mockRelease).toHaveBeenCalled())
  })
})
