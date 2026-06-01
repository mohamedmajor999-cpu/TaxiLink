import { useState } from 'react';
import { router } from 'expo-router';

import { authService, reportError } from '@taxilink/services';
import { GoogleSignInCancelledError, resolvePostGoogleSignInRoute, signInWithGoogle } from '@/lib/googleSignIn';

export function useLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  async function handleSubmit() {
    if (!email || !password) {
      setError('Email et mot de passe requis.');
      return;
    }
    setLoading(true);
    setError(null);
    setNeedsConfirmation(false);
    try {
      await authService.signIn(email.trim().toLowerCase(), password);
      router.replace('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de connexion.';
      if (/confirm/i.test(msg) || /verifie/i.test(msg)) {
        setNeedsConfirmation(true);
      } else {
        setError(translateAuthError(msg));
      }
      reportError(err, { tags: { phase: 'login' } });
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setNeedsConfirmation(false);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      router.replace(await resolvePostGoogleSignInRoute());
    } catch (err: unknown) {
      if (err instanceof GoogleSignInCancelledError) return;
      const msg = err instanceof Error ? err.message : 'Erreur de connexion Google.';
      setError(/network/i.test(msg) ? 'Pas de réseau. Vérifie ta connexion.' : msg);
      reportError(err, { tags: { phase: 'login-google' } });
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleResend() {
    if (!email) return;
    setResendLoading(true);
    try {
      await authService.resendConfirmation(email.trim().toLowerCase());
      setResendSent(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Échec de l\'envoi.';
      setError(msg);
      reportError(err, { tags: { phase: 'login-resend' } });
    } finally {
      setResendLoading(false);
    }
  }

  return {
    email, setEmail,
    password, setPassword,
    showPw, togglePw: () => setShowPw((v) => !v),
    loading, googleLoading, resendLoading, resendSent,
    error, needsConfirmation,
    handleSubmit, handleGoogle, handleResend,
  };
}

function translateAuthError(raw: string): string {
  if (/invalid login credentials/i.test(raw)) return 'Email ou mot de passe incorrect.';
  if (/email not confirmed/i.test(raw)) return 'Email non confirmé.';
  if (/network/i.test(raw)) return 'Pas de réseau. Vérifie ta connexion.';
  return raw;
}
