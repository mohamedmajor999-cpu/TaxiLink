import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { sharedStorage } from '@taxilink/stores';
import type { CourseState } from './trackingConfig';

// Etat global "session driver" partage entre la home (toggle UI) et le _layout
// (qui monte useDriverOnlineTracking + useDriverHeartbeat).
//
// Pourquoi un store et pas un useState dans la home : avec la BottomNav v3, la
// home se demonte des qu'on tape sur un autre onglet. Si les hooks de tracking
// vivaient sur la home, le foregroundService GPS et le heartbeat tombaient a
// chaque navigation → DB marque le chauffeur offline en 3 min → plus d'offres.
//
// `courseState` est ecrit par l'ecran de course active (mission/[id]/active)
// pour augmenter la frequence GPS en course. Reset a 'idle' au demontage de
// la course. Non persiste (recalcule au mount depuis le status mission).
//
// PERSISTANCE 2026-05-25 : `isOnline` est persiste via sharedStorage (
// AsyncStorage cote mobile via setPersistStorage dans init.ts, memory fallback
// en tests). Raison : le user veut rester en ligne tant qu'il n'a pas
// explicitement clique "Hors ligne". Si l'app est force-closed, le cron
// `offline-after` flip is_online=false cote DB apres 3 min sans heartbeat →
// au prochain cold start, on lit le store local (true) et on re-flip la DB
// (cf. resync dans (driver)/_layout.tsx). L'intent user est preserve. Si le
// user clique "Hors ligne", local devient false → pas de re-sync.
interface DriverSessionState {
  isOnline: boolean;
  courseState: CourseState;
  setIsOnline: (v: boolean) => void;
  setCourseState: (v: CourseState) => void;
}

export const useDriverOnlineStore = create<DriverSessionState>()(
  persist(
    (set) => ({
      isOnline: false,
      courseState: 'idle',
      setIsOnline: (v) => set({ isOnline: v }),
      setCourseState: (v) => set({ courseState: v }),
    }),
    {
      name: 'taxilink-driver-online',
      storage: createJSONStorage(() => sharedStorage),
      // courseState n'est PAS persiste : il est ephemere (etat de course en
      // cours), on le recalcule au mount depuis le status mission DB.
      partialize: (state) => ({ isOnline: state.isOnline }),
    },
  ),
);
