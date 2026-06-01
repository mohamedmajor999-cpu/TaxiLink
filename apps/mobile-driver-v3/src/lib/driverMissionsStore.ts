import { create } from 'zustand';
import type { Mission } from '@taxilink/supabase-types';

// Store local v3 pour la liste des missions disponibles affichees sur la Carte.
//
// Avant : useDriverMissions stockait la liste en local state. Quand l'utilisateur
// changeait d'onglet (router.navigate), le screen Home se demontait et le
// useState perdait son contenu → retour sur Carte = re-fetch Supabase complet
// + skeleton vide pendant 300-800ms. Tab switch lent rapporte 2026-05-24.
//
// Maintenant : la liste survit en memoire au demontage du screen. Le re-mount
// affiche instantanement la liste cachee, le realtime + un refetch en background
// raffraichissent.
//
// driverId associe permet d'invalider le cache si l'utilisateur change de
// compte (deconnexion + nouveau login). missionsFetchedAt sert au gate
// anti-tempete dans useDriverMissions.
interface DriverMissionsState {
  missions: Mission[];
  driverId: string | null;
  fetchedAt: number;
  setMissions: (driverId: string, missions: Mission[]) => void;
  updateMissions: (driverId: string, updater: (prev: Mission[]) => Mission[]) => void;
  reset: () => void;
}

export const useDriverMissionsStore = create<DriverMissionsState>((set, get) => ({
  missions: [],
  driverId: null,
  fetchedAt: 0,
  setMissions: (driverId, missions) =>
    set({ missions, driverId, fetchedAt: Date.now() }),
  updateMissions: (driverId, updater) => {
    // Garde-fou : si le store n'a jamais ete seede pour ce driverId (cas race
    // realtime event qui arrive avant le 1er fetch), on initialise.
    const state = get();
    if (state.driverId !== driverId) {
      set({ missions: updater([]), driverId, fetchedAt: Date.now() });
      return;
    }
    set({ missions: updater(state.missions) });
  },
  reset: () => set({ missions: [], driverId: null, fetchedAt: 0 }),
}));
