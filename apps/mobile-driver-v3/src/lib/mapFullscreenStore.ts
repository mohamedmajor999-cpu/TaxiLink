import { create } from 'zustand';

// Store global ultra-leger pour le mode plein-ecran de la carte d'accueil.
// Permet a la BottomNav (rendue dans le layout parent) de se cacher quand
// l'index ecran active le plein-ecran. Pas de persistance — l'etat se reset
// au demontage de la home.
interface MapFullscreenState {
  fullscreen: boolean;
  setFullscreen: (v: boolean) => void;
}

export const useMapFullscreenStore = create<MapFullscreenState>((set) => ({
  fullscreen: false,
  setFullscreen: (v) => set({ fullscreen: v }),
}));
