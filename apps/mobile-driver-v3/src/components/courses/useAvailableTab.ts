import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Mission as CoreMission } from '@taxilink/core';
import { reportError } from '@taxilink/services';
import { useMissionStore } from '@taxilink/stores';

import { useAuth } from '@/hooks/useAuth';
import { URGENT_FILTER_MIN } from '@/lib/missionFilters';

export type AvailableTypeFilter = 'all' | 'cpam' | 'prive';

interface State {
  missions: CoreMission[];
  totalCount: number;
  isLoading: boolean;
  // RES-02 : true si le dernier chargement a echoue (≠ "aucune course").
  error: boolean;
  typeFilter: AvailableTypeFilter;
  urgentOnly: boolean;
  setTypeFilter: (f: AvailableTypeFilter) => void;
  setUrgentOnly: (v: boolean) => void;
  refresh: () => Promise<void>;
}

// Hook orchestrateur de l'onglet Disponibles. Charge missions marketplace via
// useMissionStore au mount, expose filtres typeFilter + urgentOnly, retourne
// la liste filtree + le total non filtre (pour afficher "N / M" comme [[feedback-counter-vs-filtered-list]]).
export function useAvailableTab(): State {
  const { user } = useAuth();
  const allMissions = useMissionStore((s) => s.missions);
  const isLoading = useMissionStore((s) => s.isLoading);
  const load = useMissionStore((s) => s.load);

  const [typeFilter, setTypeFilter] = useState<AvailableTypeFilter>('all');
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [error, setError] = useState(false);

  // RES-02 : on enveloppe load() pour distinguer "panne" de "liste vide". Le
  // store missionStore.load re-throw en cas d'echec (pas de catch interne).
  const runLoad = useCallback(async () => {
    const uid = user?.id;
    if (!uid) return;
    setError(false);
    try {
      await load(uid);
    } catch (err) {
      reportError(err, { tags: { phase: 'available-load' } });
      setError(true);
    }
  }, [user?.id, load]);

  useEffect(() => {
    void runLoad();
  }, [runLoad]);

  const filtered = useMemo(() => {
    return allMissions.filter((m) => {
      if (typeFilter === 'cpam' && m.type !== 'CPAM') return false;
      if (typeFilter === 'prive' && m.type === 'CPAM') return false;
      if (urgentOnly) {
        const minutesUntil = Math.round((new Date(m.scheduledAt).getTime() - Date.now()) / 60000);
        if (minutesUntil > URGENT_FILTER_MIN) return false;
      }
      return true;
    });
  }, [allMissions, typeFilter, urgentOnly]);

  return {
    missions: filtered,
    totalCount: allMissions.length,
    isLoading,
    error,
    typeFilter,
    urgentOnly,
    setTypeFilter,
    setUrgentOnly,
    refresh: runLoad,
  };
}
