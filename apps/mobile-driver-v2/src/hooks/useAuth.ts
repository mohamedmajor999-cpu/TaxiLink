import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import type { User } from '@supabase/supabase-js';
import { getSupabaseClient } from '@taxilink/services';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseClient();

    // getSession() lit le storage local (instantané, pas d'appel réseau).
    // getUser() lui faisait un /auth/v1/user qui pouvait timeout au cold
    // start sur réseau lent → setUser(null) → redirect /login à tort.
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Pattern canonique Supabase RN : démarrer le refresh auto quand l'app est
    // active, le couper sinon. Sans ça, l'auto-refresh peut ne pas tourner du
    // tout en background → token expiré au retour → SIGNED_OUT → kick login.
    if (AppState.currentState === 'active') {
      supabase.auth.startAutoRefresh();
    }
    const onAppStateChange = (state: string) => {
      if (state === 'active') supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    };
    const appStateSub = AppState.addEventListener('change', onAppStateChange);

    return () => {
      subscription.unsubscribe();
      appStateSub.remove();
      supabase.auth.stopAutoRefresh();
    };
  }, []);

  return { user, loading };
}
