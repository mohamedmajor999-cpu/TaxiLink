import { create } from 'zustand';

// Popup "Nouvelle annonce dispo" affiche sur la home quand un broadcast
// Realtime INSERT arrive et que le user regarde deja la carte. Remplace
// l'Alert.alert natif (pas designable) par un Modal RN custom.
//
// Une seule annonce visible a la fois : show ecrase la precedente. Si une
// 2eme annonce arrive avant que le user reagisse, on ne empile pas — la
// derniere a priorite.
export interface MissionPopupData {
  id:        string;
  title:     string;
  departure: string;
  variant:   'cpam' | 'private';
}

interface MissionPopupState {
  current:  MissionPopupData | null;
  show:     (data: MissionPopupData) => void;
  dismiss:  () => void;
}

export const useMissionPopupStore = create<MissionPopupState>((set) => ({
  current: null,
  show:    (data) => set({ current: data }),
  dismiss: () => set({ current: null }),
}));
