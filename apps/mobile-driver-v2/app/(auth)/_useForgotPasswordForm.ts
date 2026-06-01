import { useState } from 'react';
import * as Linking from 'expo-linking';

import { authService, reportError } from '@taxilink/services';
import { isValidEmail } from '@taxilink/core';

export function useForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    if (!isValidEmail(email)) return setError('Email invalide.');

    setLoading(true);
    try {
      // Deep link mobile : taxilink-driver://reset-password
      const redirectTo = Linking.createURL('reset-password');
      await authService.resetPassword(email.trim().toLowerCase(), redirectTo);
      setSent(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Échec de l\'envoi.';
      setError(/network/i.test(msg) ? 'Pas de réseau.' : msg);
      reportError(err, { tags: { phase: 'forgot-password' } });
    } finally {
      setLoading(false);
    }
  }

  return { email, setEmail, loading, sent, error, handleSubmit };
}
