import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useSettingsToggles } from '@/components/dashboard/driver/profil/useSettingsToggles'

const KEY = 'taxilink:driver:prefs'

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
let originalLS: Storage

beforeEach(() => {
  lsMock = makeLocalStorage()
  originalLS = window.localStorage
  // Patch window.localStorage sans remplacer window (évite de casser React)
  Object.defineProperty(window, 'localStorage', { value: lsMock, writable: true, configurable: true })
})

afterEach(() => {
  Object.defineProperty(window, 'localStorage', { value: originalLS, writable: true, configurable: true })
})

describe('useSettingsToggles', () => {
  it('valeurs par défaut : notifications=true, autoDarkMode=true', async () => {
    const { result } = renderHook(() => useSettingsToggles())
    await waitFor(() => {
      expect(result.current.notifications).toBe(true)
      expect(result.current.autoDarkMode).toBe(true)
    })
  })

  it('charge les prefs depuis localStorage', async () => {
    lsMock.setItem(KEY, JSON.stringify({ notifications: false, autoDarkMode: false }))
    const { result } = renderHook(() => useSettingsToggles())
    await waitFor(() => {
      expect(result.current.notifications).toBe(false)
      expect(result.current.autoDarkMode).toBe(false)
    })
  })

  it('setNotifications(false) met à jour state et localStorage', async () => {
    const { result } = renderHook(() => useSettingsToggles())
    await waitFor(() => expect(result.current.notifications).toBe(true))
    act(() => { result.current.setNotifications(false) })
    expect(result.current.notifications).toBe(false)
    const saved = JSON.parse(lsMock.getItem(KEY)!)
    expect(saved.notifications).toBe(false)
  })

  it('setAutoDarkMode(false) met à jour state et localStorage', async () => {
    const { result } = renderHook(() => useSettingsToggles())
    await waitFor(() => expect(result.current.autoDarkMode).toBe(true))
    act(() => { result.current.setAutoDarkMode(false) })
    expect(result.current.autoDarkMode).toBe(false)
    const saved = JSON.parse(lsMock.getItem(KEY)!)
    expect(saved.autoDarkMode).toBe(false)
  })
})
