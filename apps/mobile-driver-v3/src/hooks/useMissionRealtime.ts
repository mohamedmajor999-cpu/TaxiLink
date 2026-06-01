import { useEffect, useRef } from 'react';
import {
  useMissionRealtimeContext,
  type MissionRealtimeCallbacks,
} from '@/components/realtime/MissionRealtimeProvider';

// Mirror du hook web (apps/web/.../useMissionRealtime.ts) : enregistre les
// callbacks dans le provider sans ouvrir son propre channel. Le provider
// doit etre monte au-dessus dans l'arbre (cf. app/(driver)/_layout.tsx).
export function useMissionRealtime({ onInsert, onUpdate, onDelete }: MissionRealtimeCallbacks) {
  const subscribe = useMissionRealtimeContext();
  const callbacksRef = useRef<MissionRealtimeCallbacks>({ onInsert, onUpdate, onDelete });
  callbacksRef.current = { onInsert, onUpdate, onDelete };

  useEffect(() => {
    if (!subscribe) return;
    return subscribe({
      onInsert: (m) => callbacksRef.current.onInsert?.(m),
      onUpdate: (m) => callbacksRef.current.onUpdate?.(m),
      onDelete: (m) => callbacksRef.current.onDelete?.(m),
    });
  }, [subscribe]);
}
