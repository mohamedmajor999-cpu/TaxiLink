import { useEffect, useMemo, useState } from 'react';
import { userPrefsService } from '@taxilink/services';

export function useDepartementsScreen() {
  const [serverDepts, setServerDepts] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    userPrefsService
      .getDeptPreferences()
      .then((d) => {
        if (cancelled) return;
        setServerDepts(d);
        setSelected(new Set(d));
      })
      .catch(() => {
        // fallback : liste vide, l'utilisateur peut toujours ajouter
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const dirty = useMemo(() => {
    if (selected.size !== serverDepts.length) return true;
    return !serverDepts.every((d) => selected.has(d));
  }, [selected, serverDepts]);

  function toggle(code: string) {
    setSaved(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const arr = Array.from(selected);
      await userPrefsService.updateDeptPreferences(arr);
      setServerDepts(arr);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur enregistrement');
    } finally {
      setSaving(false);
    }
  }

  return { selected, dirty, loading, saving, saved, error, toggle, save };
}
