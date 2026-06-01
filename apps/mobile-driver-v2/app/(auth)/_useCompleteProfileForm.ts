import { useMemo, useState } from 'react';
import { router } from 'expo-router';

import { getSupabaseClient, profileService, reportError } from '@taxilink/services';
import {
  isValidName,
  isValidPhone,
  ALL_DEPARTEMENTS,
  type DepartementInfo,
} from '@taxilink/core';

export function useCompleteProfileForm(initial: { firstName: string; lastName: string; phone: string; department: string }) {
  const [firstName, setFirstName] = useState(initial.firstName);
  const [lastName, setLastName] = useState(initial.lastName);
  const [phone, setPhone] = useState(initial.phone);
  const [department, setDepartment] = useState(initial.department);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const departmentInfo = useMemo<DepartementInfo | null>(() => {
    const cleaned = department.trim().toUpperCase();
    if (!cleaned) return null;
    return ALL_DEPARTEMENTS.find((d) => d.code === cleaned) ?? null;
  }, [department]);

  async function handleSubmit() {
    setError(null);
    if (!isValidName(lastName)) return setError('Nom invalide.');
    if (!isValidName(firstName)) return setError('Prénom invalide.');
    if (!isValidPhone(phone)) return setError('Téléphone invalide (format 06xxxxxxxx).');
    if (!departmentInfo) return setError('Code département non reconnu.');

    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr || !user) throw new Error('Session expirée.');

      const { error: metaErr } = await supabase.auth.updateUser({
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          full_name: `${firstName.trim()} ${lastName.trim()}`,
          phone: phone.replace(/\s/g, ''),
          dept_preferences: [departmentInfo.code],
        },
      });
      if (metaErr) throw new Error(metaErr.message);

      await profileService.updateProfile(user.id, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.replace(/\s/g, ''),
      });

      router.replace('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la mise à jour.';
      setError(msg);
      reportError(err, { tags: { phase: 'complete-profile' } });
    } finally {
      setLoading(false);
    }
  }

  return {
    firstName, setFirstName,
    lastName, setLastName,
    phone, setPhone,
    department, setDepartment, departmentInfo,
    loading, error, handleSubmit,
  };
}
