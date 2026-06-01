import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ONBOARDING_STORAGE_KEY } from './useOnboardingPage';

export type OnboardingSeenState = 'loading' | 'seen' | 'unseen';

export function useOnboardingSeen(): OnboardingSeenState {
  const [state, setState] = useState<OnboardingSeenState>('loading');

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(ONBOARDING_STORAGE_KEY)
      .then((v) => {
        if (cancelled) return;
        setState(v === '1' ? 'seen' : 'unseen');
      })
      .catch(() => {
        if (!cancelled) setState('seen');
      });
    return () => { cancelled = true; };
  }, []);

  return state;
}
