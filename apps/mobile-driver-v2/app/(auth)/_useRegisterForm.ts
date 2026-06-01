import { useMemo, useState } from 'react';
import { router } from 'expo-router';

import { authService, reportError } from '@taxilink/services';
import {
  isValidEmail,
  isValidPassword,
  isValidName,
  isValidPhone,
  PASSWORD_RULE_LABEL,
  ALL_DEPARTEMENTS,
  type DepartementInfo,
} from '@taxilink/core';
import { GoogleSignInCancelledError, resolvePostGoogleSignInRoute, signInWithGoogle } from '@/lib/googleSignIn';

export function useRegisterForm() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const departmentInfo = useMemo<DepartementInfo | null>(() => {
    const cleaned = department.trim().toUpperCase();
    if (!cleaned) return null;
    return ALL_DEPARTEMENTS.find((d) => d.code === cleaned) ?? null;
  }, [department]);

  function handleNextStep() {
    setError(null);
    if (!isValidEmail(email)) return setError('Email invalide.');
    if (!isValidPassword(password)) return setError(`Mot de passe trop faible : ${PASSWORD_RULE_LABEL}`);
    if (password !== confirmPassword) return setError('Les mots de passe ne correspondent pas.');
    setStep(2);
  }

  async function handleSubmit() {
    setError(null);
    if (!isValidName(lastName)) return setError('Nom invalide.');
    if (!isValidName(firstName)) return setError('Prénom invalide.');
    if (!isValidPhone(phone)) return setError('Numéro de téléphone invalide (format 06xxxxxxxx).');
    if (!departmentInfo) return setError('Code département non reconnu (ex : 13, 75, 2A).');

    setLoading(true);
    try {
      await authService.finalizeSignUp({
        email: email.trim().toLowerCase(),
        password,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.replace(/\s/g, ''),
        department: departmentInfo.code,
      });
      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de l\'inscription.';
      setError(translateAuthError(msg));
      reportError(err, { tags: { phase: 'register' } });
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      // Google ne fournit pas phone/departement : on regarde le profile DB
      // pour decider entre /complete-profile et la home driver.
      router.replace(await resolvePostGoogleSignInRoute());
    } catch (err: unknown) {
      if (err instanceof GoogleSignInCancelledError) return;
      const msg = err instanceof Error ? err.message : 'Erreur de connexion Google.';
      setError(/network/i.test(msg) ? 'Pas de réseau. Vérifie ta connexion.' : msg);
      reportError(err, { tags: { phase: 'register-google' } });
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
      reportError(err, { tags: { phase: 'register-resend' } });
    } finally {
      setResendLoading(false);
    }
  }

  return {
    step, setStep,
    email, setEmail,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    showPw, togglePw: () => setShowPw((v) => !v),
    showConfirmPw, toggleConfirmPw: () => setShowConfirmPw((v) => !v),
    firstName, setFirstName,
    lastName, setLastName,
    phone, setPhone,
    department, setDepartment, departmentInfo,
    loading, googleLoading, resendLoading, resendSent,
    error, success,
    handleNextStep, handleSubmit, handleGoogle, handleResend,
  };
}

function translateAuthError(raw: string): string {
  if (/already.*registered/i.test(raw) || /déjà inscrite/i.test(raw))
    return 'Cette adresse email est déjà inscrite. Connectez-vous à la place.';
  if (/password/i.test(raw) && /weak/i.test(raw)) return 'Mot de passe trop faible.';
  if (/network/i.test(raw)) return 'Pas de réseau. Vérifie ta connexion.';
  return raw;
}
