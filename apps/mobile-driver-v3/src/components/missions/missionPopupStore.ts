import { create } from 'zustand';
import type { Mission } from '@taxilink/supabase-types';

// Popup "Nouvelle annonce dispo" affiche sur la home quand un broadcast
// Realtime INSERT arrive et que le user regarde deja la carte. Remplace
// l'Alert.alert natif (pas designable) par un Modal RN custom.
//
// Une seule annonce visible a la fois : show ecrase la precedente. Si une
// 2eme annonce arrive avant que le user reagisse, on ne empile pas — la
// derniere a priorite.
//
// On stocke le Mission complet recu du broadcast Realtime : permet au popup
// d'afficher prix / distance / coords pour la mini-map / scheduled_at, et
// permet a `scheduleMissionStartReminder` de planifier la notif "as-tu
// demarre ?" 5 min apres scheduled_at sans recharger la mission depuis la DB.
export interface MissionPopupData {
  mission: Mission;
  title:   string;
  variant: 'cpam' | 'private';
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
