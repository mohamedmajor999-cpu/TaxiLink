import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useReservationForm } from '@/components/dashboard/client/useReservationForm'

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockCreate = vi.fn()

vi.mock('@/services/missionService', () => ({
  missionService: {
    create: (...a: unknown[]) => mockCreate(...a),
  },
}))

vi.mock('@/lib/api', () => ({
  ApiRequestError: class ApiRequestError extends Error {
    constructor(message: string) { super(message) }
  },
}))

const fakeEvent = { preventDefault: vi.fn() } as never

beforeEach(() => {
  vi.clearAllMocks()
  mockCreate.mockResolvedValue({})
})

// ─── handleBook — succès ──────────────────────────────────────────────────────
describe('useReservationForm — handleBook (succes)', () => {
  it('appelle missionService.create et passe success a true', async () => {
    const onBookSuccess      = vi.fn().mockResolvedValue(undefined)
    const onSwitchToMissions = vi.fn()
    const { result } = renderHook(() =>
      useReservationForm(onBookSuccess, onSwitchToMissions)
    )

    act(() => {
      result.current.setDeparture('Paris')
      result.current.setDestination('Lyon')
    })

    await act(async () => { await result.current.handleBook(fakeEvent) })

    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
      departure: 'Paris', destination: 'Lyon',
    }))
    expect(result.current.success).toBe(true)
    expect(onBookSuccess).toHaveBeenCalled()
  })

  it('remet departure et destination a vide apres succes', async () => {
    const onBookSuccess      = vi.fn().mockResolvedValue(undefined)
    const onSwitchToMissions = vi.fn()
    const { result } = renderHook(() =>
      useReservationForm(onBookSuccess, onSwitchToMissions)
    )

    act(() => {
      result.current.setDeparture('Paris')
      result.current.setDestination('Lyon')
    })
    await act(async () => { await result.current.handleBook(fakeEvent) })

    expect(result.current.departure).toBe('')
    expect(result.current.destination).toBe('')
  })
})

// ─── handleBook — scheduled_at ─────────────────────────────────────────────────
describe('useReservationForm — scheduled_at', () => {
  it('passe scheduled_at = null quand le champ est vide (course immediate)', async () => {
    const { result } = renderHook(() =>
      useReservationForm(vi.fn().mockResolvedValue(undefined), vi.fn())
    )
    act(() => {
      result.current.setDeparture('Paris')
      result.current.setDestination('Lyon')
    })
    await act(async () => { await result.current.handleBook(fakeEvent) })
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ scheduled_at: null }))
  })

  it('convertit le datetime-local en ISO UTC', async () => {
    const { result } = renderHook(() =>
      useReservationForm(vi.fn().mockResolvedValue(undefined), vi.fn())
    )
    act(() => {
      result.current.setDeparture('Paris')
      result.current.setDestination('Lyon')
      result.current.setScheduledAt('2026-05-12T14:30')
    })
    await act(async () => { await result.current.handleBook(fakeEvent) })
    const arg = mockCreate.mock.calls[0][0] as { scheduled_at: string | null }
    expect(arg.scheduled_at).not.toBeNull()
    // L'ISO doit etre parsable et representer la meme date locale
    expect(new Date(arg.scheduled_at!).toISOString()).toBe(new Date('2026-05-12T14:30').toISOString())
  })
})

// ─── handleBook — échec ───────────────────────────────────────────────────────
describe('useReservationForm — handleBook (echec)', () => {
  it('affiche submitError si create echoue', async () => {
    mockCreate.mockRejectedValue(new Error('Serveur indisponible'))
    const onBookSuccess      = vi.fn().mockResolvedValue(undefined)
    const onSwitchToMissions = vi.fn()
    const { result } = renderHook(() =>
      useReservationForm(onBookSuccess, onSwitchToMissions)
    )

    await act(async () => { await result.current.handleBook(fakeEvent) })

    expect(result.current.submitError).toBe('Impossible de contacter le serveur')
    expect(result.current.success).toBe(false)
  })
})
