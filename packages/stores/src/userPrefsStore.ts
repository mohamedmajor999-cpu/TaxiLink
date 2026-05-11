import { create } from 'zustand'
import { userPrefsService } from '@taxilink/services'

interface UserPrefsState {
  popupNewMission: boolean
  geolocPushEnabled: boolean
  loaded: boolean
  load: () => Promise<void>
  setPopupNewMission: (v: boolean) => Promise<void>
  setGeolocPushEnabled: (v: boolean) => Promise<void>
}

const DEFAULTS = { popupNewMission: true, geolocPushEnabled: true }

async function persist(patch: Partial<{ popupNewMission: boolean; geolocPushEnabled: boolean }>) {
  const current = (await userPrefsService.getNotificationPrefs()) ?? {}
  await userPrefsService.updateNotificationPrefs({ ...current, ...patch })
}

export const useUserPrefs = create<UserPrefsState>((set, get) => ({
  ...DEFAULTS,
  loaded: false,

  load: async () => {
    const raw = (await userPrefsService.getNotificationPrefs().catch(() => null)) ?? {}
    set({
      popupNewMission: raw.popupNewMission ?? DEFAULTS.popupNewMission,
      geolocPushEnabled: raw.geolocPushEnabled ?? DEFAULTS.geolocPushEnabled,
      loaded: true,
    })
  },

  // Optimistic update + rollback en cas d'echec persist : avant, on flippait
  // l'UI mais le serveur restait sur l'ancienne valeur -> au prochain load(),
  // la pref reapparaissait dans son etat d'origine sans explication.
  setPopupNewMission: async (v) => {
    const previous = get().popupNewMission
    set({ popupNewMission: v })
    try {
      await persist({ popupNewMission: v })
    } catch {
      set({ popupNewMission: previous })
    }
  },

  setGeolocPushEnabled: async (v) => {
    const previous = get().geolocPushEnabled
    set({ geolocPushEnabled: v })
    try {
      await persist({ geolocPushEnabled: v })
    } catch {
      set({ geolocPushEnabled: previous })
    }
  },
}))
