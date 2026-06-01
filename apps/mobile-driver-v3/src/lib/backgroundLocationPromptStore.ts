import { create } from 'zustand';

// Pre-prompt avant la demande de permission GPS background. Sur Android 11+
// l'OS ouvre l'ecran "Parametres de localisation" sans bouton de validation
// (le tap sur un radio button valide direct) — les chauffeurs ne comprennent
// pas et choisissent souvent "Lorsque l'app est utilisee" qui casse le
// tracking en background.
//
// Le store expose une API promise-based : `show()` retourne true si le user
// a tape "J'ai compris" (on peut continuer le flow), false sinon (annule).
//
// Pattern : Zustand pour la visibilite (re-render du modal), module-level let
// pour le resolver de la promesse (pas serialisable, pas besoin de re-render).

interface State {
  isVisible: boolean;
  show: () => Promise<boolean>;
  resolve: (continueFlow: boolean) => void;
}

let resolver: ((continueFlow: boolean) => void) | null = null;

export const useBackgroundLocationPromptStore = create<State>((set) => ({
  isVisible: false,
  show: () => {
    set({ isVisible: true });
    return new Promise<boolean>((res) => {
      resolver = res;
    });
  },
  resolve: (continueFlow) => {
    set({ isVisible: false });
    resolver?.(continueFlow);
    resolver = null;
  },
}));
