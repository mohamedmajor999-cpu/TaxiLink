import { create } from 'zustand'

interface Coords {
  lat: number
  lng: number
}

interface GpsState {
  coords: Coords | null
  accuracyM: number | null
  setCoords: (coords: Coords | null, accuracyM: number | null) => void
}

// Position GPS partagee a l'echelle du dashboard chauffeur. Remplie par
// useGlobalDriverGps (monte dans DriverDashboard), lue par useDriverHome
// (carte + tri proximite), useDriverPositionPush (push DB), et
// useAutoMissionProgress (geofence des etapes de course).
export const useGpsStore = create<GpsState>((set) => ({
  coords: null,
  accuracyM: null,
  setCoords: (coords, accuracyM) => set({ coords, accuracyM }),
}))
