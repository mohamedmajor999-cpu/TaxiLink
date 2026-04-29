import { create } from 'zustand'
import { userPrefsService } from '@/services/userPrefsService'

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

export const useUserPrefs = create<UserPrefsState>((set) => ({
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

  setPopupNewMission: async (v) => {
    set({ popupNewMission: v })
    await persist({ popupNewMission: v }).catch(() => { /* silencieux : pref pas critique */ })
  },

  setGeolocPushEnabled: async (v) => {
    set({ geolocPushEnabled: v })
    await persist({ geolocPushEnabled: v }).catch(() => { /* silencieux */ })
  },
}))
