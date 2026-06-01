import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { createMobileSupabaseClient } from '@/lib/supabase';

interface Options {
  isOnline: boolean;
  userId:   string | null;
}

// Intervalle du heartbeat foreground. Choisi a 30s : independant du fix GPS,
// il garantit que `last_seen_at` reste frais meme si l'OS allonge la
// background task de location (doze, battery optimization Pixel/Samsung).
// Cote DB le cron offline-after passe a TTL 180s ⇒ marge de 6 pings.
const HEARTBEAT_INTERVAL_MS = 30_000;

// Ping `last_seen_at` toutes les 30s tant que le chauffeur est online et que
// l'app est ouverte (foreground ou pas tuee). Decouple du push GPS background
// pour fiabiliser la presence cote admin meme quand le GPS n'a pas encore
// lock (premiere connexion, indoor, batterie OEM agressive).
//
// **Pas** un remplacement du background tracking : la task TaskManager
// continue d'envoyer position+last_seen_at quand l'app est fermee. Le
// heartbeat couvre le cas foreground/background-leger ou la task tarde.
export function useDriverHeartbeat({ isOnline, userId }: Options) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isOnline || !userId) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    async function ping() {
      try {
        const supabase = createMobileSupabaseClient();
        await supabase
          .from('drivers')
          .update({ last_seen_at: new Date().toISOString() })
          .eq('id', userId!);
      } catch (err) {
        // Ne jamais throw : un ping rate sera retry au prochain tick.
        console.warn('[useDriverHeartbeat] ping echoue', err);
      }
    }

    // Premier ping immediat (sans attendre 30s a l'allumage de l'online).
    ping();
    intervalRef.current = setInterval(ping, HEARTBEAT_INTERVAL_MS);

    // Si l'app revient en foreground apres un long background, on force un
    // ping immediat pour que l'admin voie le chauffeur en moins d'1 tick.
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') ping();
    });

    return () => {
      sub.remove();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isOnline, userId]);
}
