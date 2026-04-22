import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useCourseMap } from '@/components/dashboard/driver/course/useCourseMap'

// ─── Mock Leaflet ──────────────────────────────────────────────────────────────
// All mocks defined inside the factory to avoid hoisting issues with vi.mock
vi.mock('leaflet', () => {
  const bounds = { pad: vi.fn().mockReturnThis(), isValid: vi.fn().mockReturnValue(true) }
  const featureGroup = { getBounds: vi.fn().mockReturnValue(bounds), addTo: vi.fn().mockReturnThis() }
  const map = {
    addLayer: vi.fn().mockReturnThis(),
    fitBounds: vi.fn().mockReturnThis(),
    remove: vi.fn(),
    removeLayer: vi.fn(),
  }
  return {
    default: {
      divIcon: vi.fn().mockReturnValue({}),
      map: vi.fn().mockReturnValue(map),
      marker: vi.fn().mockReturnValue({ addTo: vi.fn().mockReturnThis() }),
      tileLayer: vi.fn().mockReturnValue({ addTo: vi.fn().mockReturnThis() }),
      latLngBounds: vi.fn().mockReturnValue(bounds),
      geoJSON: vi.fn().mockReturnValue({ addTo: vi.fn().mockReturnThis() }),
      featureGroup: vi.fn().mockReturnValue(featureGroup),
    },
  }
})

vi.mock('leaflet/dist/leaflet.css', () => ({}))

const FROM = { lat: 48.85, lng: 2.35 }
const TO = { lat: 45.75, lng: 4.85 }

describe('useCourseMap', () => {
  it('retourne un containerRef', () => {
    const { result } = renderHook(() =>
      useCourseMap({ from: FROM, to: TO }),
    )
    expect(result.current.containerRef).toBeDefined()
    expect(result.current.containerRef).toHaveProperty('current')
  })

  it('ne plante pas avec routeGeometry null', () => {
    expect(() => {
      renderHook(() =>
        useCourseMap({ from: FROM, to: TO, routeGeometry: null }),
      )
    }).not.toThrow()
  })

  it('ne plante pas avec routeGeometry fourni', () => {
    const geometry: GeoJSON.LineString = { type: 'LineString', coordinates: [[2.35, 48.85], [4.85, 45.75]] }
    expect(() => {
      renderHook(() =>
        useCourseMap({ from: FROM, to: TO, routeGeometry: geometry }),
      )
    }).not.toThrow()
  })
})
