import { useEffect, useRef } from 'react';
import { TextInput } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

type VolumeManagerLike = {
  getVolume: () => Promise<{ volume: number } | number>;
  setVolume: (v: number, opts?: unknown) => Promise<void>;
  addVolumeListener: (cb: (data: { volume: number }) => void) => { remove: () => void };
};

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

function loadVolumeManager(): VolumeManagerLike | null {
  if (isExpoGo) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('react-native-volume-manager') as { VolumeManager?: VolumeManagerLike };
    return mod.VolumeManager ?? null;
  } catch {
    return null;
  }
}

interface Options {
  enabled: boolean;
  onTrigger: () => void;
}

/**
 * Détecte une pression sur Volume + tant que l'app est au premier plan et
 * qu'aucun champ texte n'a le focus. Restore le volume précédent juste après
 * pour donner l'illusion que le bouton n'a fait que déclencher l'action.
 */
export function useVolumeShortcut({ enabled, onTrigger }: Options): void {
  const onTriggerRef = useRef(onTrigger);
  onTriggerRef.current = onTrigger;

  const prevVolumeRef = useRef<number | null>(null);
  const isRestoringRef = useRef(false);
  const lastTriggerAtRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    const VM = loadVolumeManager();
    if (!VM) return;

    let mounted = true;
    let sub: { remove: () => void } | null = null;

    VM.getVolume()
      .then((v) => {
        if (!mounted) return;
        prevVolumeRef.current = typeof v === 'number' ? v : v.volume;
      })
      .catch(() => undefined);

    sub = VM.addVolumeListener(async ({ volume }) => {
      if (isRestoringRef.current) {
        isRestoringRef.current = false;
        prevVolumeRef.current = volume;
        return;
      }
      const prev = prevVolumeRef.current;
      prevVolumeRef.current = volume;
      if (prev == null) return;
      // Tolère un epsilon : volume Android arrive en steps ~0.0625
      if (volume <= prev + 0.01) return;

      // Restore l'ancien volume (le bouton physique a juste servi à déclencher)
      isRestoringRef.current = true;
      try {
        await VM.setVolume(prev);
        prevVolumeRef.current = prev;
      } catch {
        // ignore
      }

      // Si un champ texte est focus → c'est probablement intentionnel (l'user
      // règle vraiment le volume pendant qu'il écrit), on laisse passer.
      const focused = TextInput.State.currentlyFocusedInput?.();
      if (focused) return;

      // Debounce 800ms : évite trigger multiple si l'OS spam des events
      const now = Date.now();
      if (now - lastTriggerAtRef.current < 800) return;
      lastTriggerAtRef.current = now;

      onTriggerRef.current();
    });

    return () => {
      mounted = false;
      sub?.remove();
    };
  }, [enabled]);
}
