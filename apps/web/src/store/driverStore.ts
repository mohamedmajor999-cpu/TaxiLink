import { create } from 'zustand'
import type { Driver } from '@taxilink/core'
import { profileService } from '@/services/profileService'
import { driverService } from '@/services/driverService'
import { authService } from '@/services/authService'

interface DriverState {
  driver: Driver
  isLoading: boolean
  load: (userId: string, email: string) => Promise<void>
  setOnline: (online: boolean) => void
  updateDriver: (patch: Partial<Driver>) => void
  incrementTodayStats: (rides: number, km: number, earnings: number) => void
  signOut: () => Promise<void>
}

const defaultDriver: Driver = {
  id: '',
  name: 'Chauffeur',
  email: '',
  cpamEnabled: false,
  rating: 0,
  totalRides: 0,
  isOnline: false,
  createdAt: new Date().toISOString(),
}

export const useDriverStore = create<DriverState>((set, get) => ({
  driver: defaultDriver,
  isLoading: false,

  load: async (userId, email) => {
    set({ isLoading: true })
    try {
      const [profile, driver] = await Promise.all([
        profileService.getProfile(userId),
        driverService.getDriver(userId),
      ])
      set({
        driver: {
          id: userId,
          name: profile?.full_name ?? 'Chauffeur',
          email,
          phone: profile?.phone ?? undefined,
          vehicle: driver?.vehicle_model ?? undefined,
          vehicleType: driver?.vehicle_type ?? undefined,
          cpamEnabled: driver?.cpam_enabled ?? false,
          rating: driver?.rating ?? 0,
          totalRides: driver?.total_rides ?? 0,
          isOnline: driver?.is_online ?? false,
          avatarUrl: profile?.avatar_url ?? undefined,
          createdAt: profile?.created_at ?? new Date().toISOString(),
          todayEarnings: 0,
          todayRides: 0,
          todayKm: 0,
        },
      })
    } finally {
      set({ isLoading: false })
    }
  },

  setOnline: (online) => {
    const { driver } = get()
    set((state) => ({ driver: { ...state.driver, isOnline: online } }))
    if (driver.id) {
      driverService.setOnline(driver.id, online).catch(console.error)
    }
  },

  updateDriver: (patch) =>
    set((state) => ({ driver: { ...state.driver, ...patch } })),

  incrementTodayStats: (rides, km, earnings) =>
    set((state) => ({
      driver: {
        ...state.driver,
        todayRides: (state.driver.todayRides ?? 0) + rides,
        todayKm: (state.driver.todayKm ?? 0) + km,
        todayEarnings: (state.driver.todayEarnings ?? 0) + earnings,
      },
    })),

  // Bascule serveur is_online=false avant le signOut pour ne pas laisser le
  // chauffeur indique en ligne dans les groupes apres deconnexion volontaire.
  // Le best-effort silencieux (catch) couvre le cas reseau down : on ne bloque
  // jamais la sortie de session pour autant.
  signOut: async () => {
    const { driver } = get()
    if (driver.id) {
      await driverService.setOnline(driver.id, false).catch(() => { /* best-effort */ })
    }
    await authService.signOut()
    set({ driver: defaultDriver, isLoading: false })
  },
}))
