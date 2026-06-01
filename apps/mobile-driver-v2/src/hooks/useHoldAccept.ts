import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Vibration } from 'react-native';

export type HoldState = 'idle' | 'pressing' | 'confirmed';

interface Options {
  onConfirm: () => void | Promise<void>;
  duration?: number;
  disabled?: boolean;
}

// Hook hold-to-confirm pour mobile (mirror PWA useHoldAcceptButton).
// 3 états : idle → pressing (timer 1250ms) → confirmed (vibration + 300ms pause + onConfirm).
// Annulation possible uniquement avant confirmed (relâchement avant la fin du timer).
// Expose progress (Animated.Value 0→1) pour animer un fill visuel pendant le press.
export function useHoldAccept({ onConfirm, duration = 1250, disabled = false }: Options) {
  const [state, setState] = useState<HoldState>('idle');
  const progress = useRef(new Animated.Value(0)).current;
  const stateRef = useRef<HoldState>('idle');
  stateRef.current = state;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (confirmTimerRef.current) {
      clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = null;
    }
  };

  const start = useCallback(() => {
    if (disabled) return;
    if (stateRef.current !== 'idle') return;
    setState('pressing');
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration,
      useNativeDriver: false, // on anime width (layout) → impossible avec native driver
    }).start();
    timerRef.current = setTimeout(() => {
      setState('confirmed');
      Vibration.vibrate(50);
      // 300ms de pause pour laisser voir "Course acceptée" avant l'action (PWA-faithful)
      confirmTimerRef.current = setTimeout(() => void onConfirm(), 300);
    }, duration);
  }, [duration, onConfirm, disabled, progress]);

  const cancel = useCallback(() => {
    if (stateRef.current === 'confirmed') return;
    clearTimers();
    Animated.timing(progress, {
      toValue: 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
    setState('idle');
  }, [progress]);

  // Cleanup au unmount pour éviter les setState après démontage
  useEffect(() => () => clearTimers(), []);

  return { state, start, cancel, progress };
}
