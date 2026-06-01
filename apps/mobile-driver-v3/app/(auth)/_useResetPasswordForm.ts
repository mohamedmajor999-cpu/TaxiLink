import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';

import { authService, getSupabaseClient, reportError } from '@taxilink/services';
import { isValidPassword, PASSWORD_RULE_LABEL } from '@taxilink/core';

export function useResetPasswordForm() {
  const params = useLocalSearchParams<{ code?: string; token_hash?: string; type?: string }>();
  const [exchanging, setExchanging] = useState(true);
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Echange du code/token reçu via deep link contre une session Supabase.
  useEffect(() => {
    (async () => {
      try {
        const supabase = getSupabaseClient();
        if (params.code) {
          await authService.exchangeCodeForSession(params.code);
          setReady(true);
        } else if (params.token_hash && params.type) {
          const { error: vErr } = await supabase.auth.verifyOtp({
            type: 'recovery',
            token_hash: params.token_hash,
          });
          if (vErr) throw new Error(vErr.message);
          setReady(true);
        } else {
          // Pas de token : on regarde si une session existe deja (cas user vient de la PWA web)
          const { data } = await supabase.auth.getSession();
          if (data.session) setReady(true);
          else setError('Lien de réinitialisation invalide ou expiré.');
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Lien invalide.';
        setError(msg);
        reportError(err, { tags: { phase: 'reset-password-exchange' } });
      } finally {
        setExchanging(false);
      }
    })();
  }, [params.code, params.token_hash, params.type]);

  async function handleSubmit() {
    setError(null);
    if (!isValidPassword(password)) return setError(`Mot de passe trop faible : ${PASSWORD_RULE_LABEL}`);
    if (password !== confirmPassword) return setError('Les mots de passe ne correspondent pas.');

    setLoading(true);
    try {
      await authService.updatePassword(password);
      router.replace('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la mise à jour.';
      setError(msg);
      reportError(err, { tags: { phase: 'reset-password-update' } });
    } finally {
      setLoading(false);
    }
  }

  return {
    exchanging, ready,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    showPw, togglePw: () => setShowPw((v) => !v),
    loading, error, handleSubmit,
  };
}
