import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { AddressSuggestion } from '@/services/addressService'

// ─── Mocks ───────────────────────────────────────────────────────────────────
const mockSearchGoogle = vi.fn()
const mockResolveGooglePlace = vi.fn()
const mockPrimeCache = vi.fn()

vi.mock('@/services/addressService', () => ({
  isGoogleMapsKeyConfigured: () => true,
  searchGoogle: (...a: unknown[]) => mockSearchGoogle(...a),
  resolveGooglePlace: (...a: unknown[]) => mockResolveGooglePlace(...a),
  primeGoogleAutocompleteCache: (...a: unknown[]) => mockPrimeCache(...a),
}))

const SUGGESTIONS: AddressSuggestion[] = [
  { label: '10 Rue de la Paix, Paris', lat: 48.87, lng: 2.33, score: 0.9, placeId: 'pid1', mainText: '10 Rue de la Paix' },
]

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  mockSearchGoogle.mockResolvedValue(SUGGESTIONS)
  mockResolveGooglePlace.mockResolvedValue(null)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useAddressField', () => {
  it('suggestions vides si valeur < 3 caractères', async () => {
    const { useAddressField } = await import('@/components/dashboard/driver/useAddressField')
    const onChange = vi.fn()
    const { result } = renderHook(() =>
      useAddressField({ value: 'ab', onChange, onSelectSuggestion: vi.fn() }),
    )
    await act(async () => { await vi.runAllTimersAsync() })
    expect(result.current.suggestions).toHaveLength(0)
    expect(mockSearchGoogle).not.toHaveBeenCalled()
  })

  it('appelle searchGoogle après le debounce si valeur >= 3 chars', async () => {
    const { useAddressField } = await import('@/components/dashboard/driver/useAddressField')
    const onChange = vi.fn()
    const { result } = renderHook(() =>
      useAddressField({ value: 'Paris centre', onChange, onSelectSuggestion: vi.fn() }),
    )
    await act(async () => { await vi.runAllTimersAsync() })
    expect(mockSearchGoogle).toHaveBeenCalledTimes(1)
    expect(result.current.suggestions).toHaveLength(1)
  })

  it('handleSelect appelle onSelectSuggestion et vide les suggestions', async () => {
    const { useAddressField } = await import('@/components/dashboard/driver/useAddressField')
    const onSelectSuggestion = vi.fn()
    const onChange = vi.fn()
    const { result } = renderHook(() =>
      useAddressField({ value: 'Paris centre', onChange, onSelectSuggestion }),
    )
    await act(async () => { await vi.runAllTimersAsync() })
    await act(async () => { await result.current.handleSelect(SUGGESTIONS[0]) })
    expect(onSelectSuggestion).toHaveBeenCalledWith(SUGGESTIONS[0])
    expect(result.current.suggestions).toHaveLength(0)
  })

  it('Escape ferme le dropdown', async () => {
    const { useAddressField } = await import('@/components/dashboard/driver/useAddressField')
    const onChange = vi.fn()
    const { result } = renderHook(() =>
      useAddressField({ value: 'Paris centre', onChange, onSelectSuggestion: vi.fn() }),
    )
    await act(async () => { await vi.runAllTimersAsync() })
    act(() => {
      result.current.handleInput('Paris centre')
      result.current.handleKeyDown({ key: 'Escape' } as React.KeyboardEvent<HTMLInputElement>)
    })
    expect(result.current.open).toBe(false)
  })

  it('apiError null si Google Maps configuré', async () => {
    const { useAddressField } = await import('@/components/dashboard/driver/useAddressField')
    const { result } = renderHook(() =>
      useAddressField({ value: '', onChange: vi.fn(), onSelectSuggestion: vi.fn() }),
    )
    expect(result.current.apiError).toBeNull()
  })

  it('erreur réseau renseigne apiError', async () => {
    mockSearchGoogle.mockRejectedValueOnce(new Error('API KO'))
    const { useAddressField } = await import('@/components/dashboard/driver/useAddressField')
    const { result } = renderHook(() =>
      useAddressField({ value: 'Paris centre', onChange: vi.fn(), onSelectSuggestion: vi.fn() }),
    )
    await act(async () => { await vi.runAllTimersAsync() })
    expect(result.current.apiError).toBeTruthy()
  })
})
