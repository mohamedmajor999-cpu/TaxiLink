import { create } from 'zustand'
import * as Sentry from '@sentry/nextjs'
import type { Driver } from '@taxilink/core'
import { profileService } from '@/services/profileService'
import { driverService } from '@/services/driverService'
import { authService } from '@/services/authService'

interface DriverState {
  driver: Driver
  isLoading: boolean
  loadedUserId: string | null
  load: (userId: string, email: string) => Promise<void>
  setOnline: (online: boolean) => Promise<void>
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
  loadedUserId: null,

  // Idempotent par userId : un remount du DriverDashboard (ex. retour depuis
  // /dashboard/poster-mockup) ne doit PAS refetch et ecraser l'isOnline local
  // par une valeur DB potentiellement obsolete (ecriture setOnline encore en
  // vol, ou cron qui a flip pendant qu'on etait sur une autre page).
  load: async (userId, email) => {
    if (get().loadedUserId === userId) return
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
          vehiclePlate: driver?.vehicle_plate ?? undefined,
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
        loadedUserId: userId,
      })
    } finally {
      set({ isLoading: false })
    }
  },

  // Await l'ecriture DB : sans ca, un clic "En ligne" suivi d'une navigation
  // rapide pouvait perdre l'ecriture (fire-and-forget) → au remount, load()
  // relisait l'ancienne valeur. Optimistic UI conserve, mais on ne rend la
  // main qu'apres confirmation serveur. En cas d'erreur on rollback le local
  // pour rester coherent avec la DB.
  setOnline: async (online) => {
    const { driver } = get()
    set((state) => ({ driver: { ...state.driver, isOnline: online } }))
    if (!driver.id) return
    try {
      await driverService.setOnline(driver.id, online)
    } catch (err) {
      Sentry.captureException(err, { tags: { context: 'setOnline' } })
      set((state) => ({ driver: { ...state.driver, isOnline: !online } }))
      throw err
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
      await driverService.setOnline(driver.id, false).catch((err) => {
        // best-effort : on ne bloque jamais le signOut. On capture tout de
        // meme dans Sentry pour ne pas perdre le signal en cas de probleme
        // recurrent (chauffeurs fantomes recurrents = symptome).
        Sentry.captureException(err, { tags: { context: 'signOut.flipOffline' } })
      })
    }
    await authService.signOut()
    set({ driver: defaultDriver, isLoading: false, loadedUserId: null })
  },
}))
