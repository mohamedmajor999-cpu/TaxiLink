import { create } from 'zustand'

interface Coords { lat: number; lng: number }

interface GpsState {
  coords: Coords | null
  accuracyM: number | null
  setCoords: (coords: Coords | null, accuracyM: number | null) => void
}

// Position GPS partagée à l'échelle du dashboard chauffeur. Remplie par
// useGlobalDriverGps (monté dans DriverDashboard), lue par useDriverHome
// (carte + tri proximité), useDriverPositionPush (push DB), et
// useAutoMissionProgress (geofence des étapes de course).
export const useGpsStore = create<GpsState>((set) => ({
  coords: null,
  accuracyM: null,
  setCoords: (coords, accuracyM) => set({ coords, accuracyM }),
}))
