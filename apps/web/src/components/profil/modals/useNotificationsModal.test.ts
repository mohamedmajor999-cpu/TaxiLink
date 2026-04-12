import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useNotificationsModal } from './useNotificationsModal'

// ─── Mocks ────────────────────────────────────────────────────────────────────
const { mockGetNotificationPrefs, mockUpdateNotificationPrefs } = vi.hoisted(() => ({
  mockGetNotificationPrefs: vi.fn(),
  mockUpdateNotificationPrefs: vi.fn(),
}))

vi.mock('@/services/authService', () => ({
  authService: {
    getNotificationPrefs: mockGetNotificationPrefs,
    updateNotificationPrefs: mockUpdateNotificationPrefs,
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockUpdateNotificationPrefs.mockResolvedValue(undefined)
})

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('useNotificationsModal', () => {
  it('utilise les prefs par défaut au montage si aucune préférence sauvegardée', async () => {
    mockGetNotificationPrefs.mockResolvedValue(null)
    const { result } = renderHook(() => useNotificationsModal())
    await waitFor(() => expect(mockGetNotificationPrefs).toHaveBeenCalled())
    expect(result.current.prefs.new_missions).toBe(true)
    expect(result.current.prefs.reminders).toBe(true)
    expect(result.current.prefs.sounds).toBe(true)
    expect(result.current.prefs.vibrations).toBe(false)
  })

  it('charge les prefs sauvegardées depuis Supabase', async () => {
    mockGetNotificationPrefs.mockResolvedValue({
      new_missions: false,
      reminders: false,
      sounds: true,
      vibrations: true,
    })
    const { result } = renderHook(() => useNotificationsModal())
    await waitFor(() => expect(result.current.prefs.new_missions).toBe(false))
    expect(result.current.prefs.reminders).toBe(false)
    expect(result.current.prefs.vibrations).toBe(true)
  })

  it('toggle() inverse la valeur d\'une préférence', async () => {
    mockGetNotificationPrefs.mockResolvedValue(null)
    const { result } = renderHook(() => useNotificationsModal())
    await waitFor(() => expect(mockGetNotificationPrefs).toHaveBeenCalled())

    act(() => { result.current.toggle('new_missions') })
    expect(result.current.prefs.new_missions).toBe(false)

    act(() => { result.current.toggle('new_missions') })
    expect(result.current.prefs.new_missions).toBe(true)
  })

  it('toggle() appelle updateNotificationPrefs avec les prefs mises à jour', async () => {
    mockGetNotificationPrefs.mockResolvedValue(null)
    const { result } = renderHook(() => useNotificationsModal())
    await waitFor(() => expect(mockGetNotificationPrefs).toHaveBeenCalled())

    act(() => { result.current.toggle('sounds') })
    await waitFor(() => expect(mockUpdateNotificationPrefs).toHaveBeenCalled())

    const calledWith = mockUpdateNotificationPrefs.mock.calls[0][0]
    expect(calledWith.sounds).toBe(false)
  })

  it('toggle() ne modifie pas les autres préférences', async () => {
    mockGetNotificationPrefs.mockResolvedValue(null)
    const { result } = renderHook(() => useNotificationsModal())
    await waitFor(() => expect(mockGetNotificationPrefs).toHaveBeenCalled())

    act(() => { result.current.toggle('vibrations') })
    expect(result.current.prefs.new_missions).toBe(true)
    expect(result.current.prefs.reminders).toBe(true)
    expect(result.current.prefs.sounds).toBe(true)
    expect(result.current.prefs.vibrations).toBe(true)
  })
})
