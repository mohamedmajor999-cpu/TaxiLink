import { useEffect, useState } from 'react';
import { profileService } from '@taxilink/services';
import { isValidPhone } from '@taxilink/core';

interface Initial {
  firstName: string;
  lastName: string;
  phone: string;
}

const EMPTY: Initial = { firstName: '', lastName: '', phone: '' };

function splitFirst(fullName: string | null | undefined): string {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  return parts.slice(0, -1).join(' ') || parts[0] || '';
}
function splitLast(fullName: string | null | undefined): string {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  return parts.length > 1 ? (parts[parts.length - 1] ?? '') : '';
}

export function usePersonalInfoScreen(userId: string | null, userEmail: string | null) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [initial, setInitial] = useState<Initial>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    profileService
      .getProfile(userId)
      .then((p) => {
        if (cancelled || !p) return;
        const fn = p.first_name ?? splitFirst(p.full_name);
        const ln = p.last_name ?? splitLast(p.full_name);
        const ph = p.phone ?? '';
        setFirstName(fn);
        setLastName(ln);
        setPhone(ph);
        setInitial({ firstName: fn, lastName: ln, phone: ph });
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Erreur de chargement');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const dirty =
    firstName !== initial.firstName || lastName !== initial.lastName || phone !== initial.phone;

  async function save() {
    if (!userId) return;
    setError(null);
    if (firstName.trim().length < 2) {
      setError('Prénom : 2 caractères minimum');
      return;
    }
    if (lastName.trim().length < 2) {
      setError('Nom : 2 caractères minimum');
      return;
    }
    if (!phone.trim()) {
      setError('Téléphone obligatoire');
      return;
    }
    if (!isValidPhone(phone)) {
      setError('Format de téléphone invalide (ex: 0601020304)');
      return;
    }
    setSaving(true);
    try {
      const first = firstName.trim();
      const last = lastName.trim();
      const phoneTrimmed = phone.trim();
      await profileService.updateProfile(userId, {
        first_name: first,
        last_name: last,
        phone: phoneTrimmed,
      });
      setInitial({ firstName: first, lastName: last, phone: phoneTrimmed });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  }

  return {
    firstName,
    lastName,
    phone,
    email: userEmail ?? '',
    loading,
    saving,
    saved,
    error,
    dirty,
    setFirstName,
    setLastName,
    setPhone,
    save,
  };
}
