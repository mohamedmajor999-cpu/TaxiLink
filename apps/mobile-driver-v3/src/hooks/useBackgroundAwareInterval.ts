import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

// Variante de setInterval qui s'arrete automatiquement quand l'app passe en
// background, et redemarre quand elle revient au foreground. Tres efficace
// pour les "tickers" UI (recalcul "Urgent dans Xmin", relayout cartes par
// minute, etc.) qui n'ont aucune utilite ecran eteint.
//
// Conventions :
//   - callback NE doit PAS etre depend de state pour ne pas re-creer l'interval
//     a chaque render. Utilise useRef si besoin de lire un state frais.
//   - delay > 0. Si null => pas d'interval (utile pour gate conditionnel).
//   - Au foreground, fire un tick immediat pour rattraper le retard.
export function useBackgroundAwareInterval(callback: () => void, delay: number | null) {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    if (delay == null || delay <= 0) return;

    let intervalId: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (intervalId != null) return;
      // Tick immediat au (re)demarrage pour ne pas attendre `delay` ms quand
      // l'app revient au foreground.
      cbRef.current();
      intervalId = setInterval(() => cbRef.current(), delay);
    };

    const stop = () => {
      if (intervalId != null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    // Etat initial : start si foreground, sinon attendre.
    if (AppState.currentState === 'active') start();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') start();
      else stop();
    });

    return () => {
      stop();
      sub.remove();
    };
  }, [delay]);
}
