import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMissionRoute } from '@/components/dashboard/driver/useMissionRoute'

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockComputeRoute = vi.fn()
const mockComputeRouteGoogle = vi.fn()

vi.mock('@/services/addressService', () => ({
  computeRoute: (...a: unknown[]) => mockComputeRoute(...a),
  computeRouteGoogle: (...a: unknown[]) => mockComputeRouteGoogle(...a),
}))

const FROM = { lat: 48.85, lng: 2.35 }
const TO = { lat: 45.75, lng: 4.85 }
const ROUTE = { distance_km: 400, duration_min: 260, geometry: { type: 'LineString', coordinates: [] } }

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  mockComputeRouteGoogle.mockResolvedValue(null)
  mockComputeRoute.mockResolvedValue(ROUTE)
})

afterEach(() => {
  vi.useRealTimers()
})

// ─── État initial ─────────────────────────────────────────────────────────────
describe('useMissionRoute — état initial', () => {
  it('toutes les valeurs sont null par défaut', () => {
    const { result } = renderHook(() => useMissionRoute())
    expect(result.current.departureCoords).toBeNull()
    expect(result.current.destinationCoords).toBeNull()
    expect(result.current.distanceKm).toBeNull()
    expect(result.current.durationMin).toBeNull()
    expect(result.current.routeGeometry).toBeNull()
    expect(result.current.loadingRoute).toBe(false)
    expect(result.current.routeError).toBeNull()
  })

  it('initialise avec les coords passées en argument', () => {
    const { result } = renderHook(() =>
      useMissionRoute({
        initialDeparture: FROM, initialDestination: TO,
        initialDistanceKm: 400, initialDurationMin: 260,
      }),
    )
    expect(result.current.departureCoords).toEqual(FROM)
    expect(result.current.destinationCoords).toEqual(TO)
    expect(result.current.distanceKm).toBe(400)
    expect(result.current.durationMin).toBe(260)
  })
})

// ─── setters ─────────────────────────────────────────────────────────────────
describe('useMissionRoute — setters', () => {
  it('setDepartureCoords remet distance et routeGeometry à null', () => {
    const { result } = renderHook(() =>
      useMissionRoute({ initialDistanceKm: 100, initialDurationMin: 60 }),
    )
    act(() => { result.current.setDepartureCoords(FROM) })
    expect(result.current.distanceKm).toBeNull()
    expect(result.current.durationMin).toBeNull()
    expect(result.current.routeGeometry).toBeNull()
  })

  it('setDestinationCoords remet distance à null', () => {
    const { result } = renderHook(() =>
      useMissionRoute({ initialDistanceKm: 100 }),
    )
    act(() => { result.current.setDestinationCoords(TO) })
    expect(result.current.distanceKm).toBeNull()
  })
})

// ─── Calcul de route (debounce 400ms) ────────────────────────────────────────
describe('useMissionRoute — calcul de route', () => {
  it('appelle computeRoute après le debounce et met à jour les valeurs', async () => {
    const { result } = renderHook(() => useMissionRoute())

    act(() => { result.current.setDepartureCoords(FROM) })
    act(() => { result.current.setDestinationCoords(TO) })
    expect(result.current.loadingRoute).toBe(true)
    expect(mockComputeRoute).not.toHaveBeenCalled()

    await act(async () => { await vi.runAllTimersAsync() })

    expect(mockComputeRoute).toHaveBeenCalledTimes(1)
    expect(result.current.distanceKm).toBe(400)
    expect(result.current.durationMin).toBe(260)
    expect(result.current.loadingRoute).toBe(false)
  })

  it('utilise le résultat Google si disponible', async () => {
    const googleRoute = { distance_km: 380, duration_min: 240, geometry: null }
    mockComputeRouteGoogle.mockResolvedValueOnce(googleRoute)

    const { result } = renderHook(() => useMissionRoute())
    act(() => { result.current.setDepartureCoords(FROM) })
    act(() => { result.current.setDestinationCoords(TO) })
    await act(async () => { await vi.runAllTimersAsync() })

    expect(result.current.distanceKm).toBe(380)
    expect(mockComputeRoute).not.toHaveBeenCalled()
  })

  it('gère les erreurs de route', async () => {
    mockComputeRouteGoogle.mockResolvedValueOnce(null)
    mockComputeRoute.mockRejectedValueOnce(new Error('réseau KO'))

    const { result } = renderHook(() => useMissionRoute())
    act(() => { result.current.setDepartureCoords(FROM) })
    act(() => { result.current.setDestinationCoords(TO) })
    await act(async () => { await vi.runAllTimersAsync() })

    expect(result.current.routeError).toBeTruthy()
    expect(result.current.distanceKm).toBeNull()
    expect(result.current.loadingRoute).toBe(false)
  })

  it("ne lance pas de calcul si une seule coord est définie", async () => {
    const { result } = renderHook(() => useMissionRoute())
    act(() => { result.current.setDepartureCoords(FROM) })
    await act(async () => { await vi.runAllTimersAsync() })
    expect(mockComputeRoute).not.toHaveBeenCalled()
    expect(result.current.loadingRoute).toBe(false)
  })
})
