import { create } from 'zustand';

// Notification in-app affichee comme une banniere qui slide depuis le haut,
// style WhatsApp. Utilisee quand l'app est ouverte ET que le user n'est pas
// sur l'ecran d'accueil (home avec la carte) — sur l'accueil, on prefere
// l'Alert.alert qui prend tout l'ecran avec Accepter/Refuser.
//
// Une seule banniere a la fois : le show ecrase la precedente. Le hook
// InAppNotificationBanner pilote l'animation et l'auto-dismiss.
export interface InAppNotification {
  id: string;
  title: string;
  body: string;
  missionId: string;
  // Channel cosmetique : determine la couleur d'accent de la banniere.
  variant: 'new-mission' | 'mission-accepted' | 'direct-offer';
}

interface InAppNotificationState {
  current: InAppNotification | null;
  show: (n: Omit<InAppNotification, 'id'>) => void;
  dismiss: () => void;
}

export const useInAppNotificationStore = create<InAppNotificationState>((set) => ({
  current: null,
  show: (n) => set({ current: { ...n, id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}` } }),
  dismiss: () => set({ current: null }),
}));
