import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { sharedStorage } from './_storage'

interface Coords {
  lat: number
  lng: number
}

interface GpsState {
  coords: Coords | null
  accuracyM: number | null
  // Vrai quand le tracking GPS en arriere-plan tourne (mobile, foregroundService
  // Android via useDriverOnlineTracking). Permet au tracker foreground
  // (useDriverGpsTracking) de couper son propre watchPositionAsync et lire le
  // cache OS a la place — sinon deux radios GPS tournent en parallele et la
  // batterie fond.
  // Toujours false cote web (pas de background tracking PWA).
  isBackgroundActive: boolean
  setCoords: (coords: Coords | null, accuracyM: number | null) => void
  setBackgroundActive: (active: boolean) => void
}

// Position GPS partagee a l'echelle du dashboard chauffeur. Remplie par
// useGlobalDriverGps (web) ou useDriverGpsTracking (mobile, monte dans
// (driver)/_layout.tsx), lue par useDriverHome (carte + tri proximite),
// useDriverPositionPush (push DB), et useAutoMissionProgress (geofence).
//
// Persistance : seules les coords sont persistees (pas l'accuracy : la
// precision d'un fix passe ne renseigne pas sur le fix suivant).
// - Web   : localStorage via sharedStorage default.
// - Mobile : AsyncStorage via sharedStorage injecte par initApp().
// Permet au cold-start de centrer instantanement la carte sur la derniere
// position connue au lieu d'un fallback hardcode (Paris) en attendant un fix.
export const useGpsStore = create<GpsState>()(
  persist(
    (set) => ({
      coords: null,
      accuracyM: null,
      isBackgroundActive: false,
      setCoords: (coords, accuracyM) => set({ coords, accuracyM }),
      setBackgroundActive: (isBackgroundActive) => set({ isBackgroundActive }),
    }),
    {
      name: 'taxilink.gps',
      storage: createJSONStorage(() => sharedStorage),
      partialize: (state) => ({ coords: state.coords }),
    },
  ),
)
