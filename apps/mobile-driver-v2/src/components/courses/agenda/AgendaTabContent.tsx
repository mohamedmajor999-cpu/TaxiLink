import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';
import { router } from 'expo-router';
import type { Mission } from '@taxilink/supabase-types';
import { missionService, reportError } from '@taxilink/services';
import { useDriverAgendaStore } from '@taxilink/stores';

import { useTheme } from '@/lib/theme';
import { CourseActionsMenu } from '../CourseActionsMenu';
import { WeekStrip } from '../ads/WeekStrip';
import {
  type AgendaDayGroup,
  MAX_OFFSET,
  addDays,
  agendaDayLabel,
  buildAgendaDays,
  startOfDay,
} from './agendaHelpers';
import { AgendaDayBlock } from './AgendaDayBlock';

// Onglet Agenda fidèle apps/web/.../AgendaTab.tsx :
// - Ligne "Semaine du X au Y mai" (capitalized)
// - WeekStrip 7 jours navigables (jours hors fenêtre J→J+15 grisés)
// - 1 seul jour visible à la fois → AgendaDayBlock
// L'agenda est alimenté par useDriverAgendaSync (monté dans courses.tsx)
// qui fetch une fois + propage les events realtime au store partagé.
// Stubs : modals add/edit/cancel/delete + menu carte (Alert "À venir").
export function AgendaTabContent() {
  const { colors } = useTheme();
  const missions = useDriverAgendaStore((s) => s.missions);
  const loading = useDriverAgendaStore((s) => s.isLoading);
  const [selected, setSelected] = useState(new Date());
  const [nowTick, setNowTick] = useState(Date.now());

  // Tick chaque minute pour rafraîchir le statut (now / completed)
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const today = useMemo(() => startOfDay(new Date()), [nowTick]);
  const maxDate = useMemo(() => addDays(today, MAX_OFFSET), [today]);

  // Label "Mardi 12 mai 2026" pour le jour selectionne (remplace l'ancien
  // "Semaine du X au Y" qui n'a plus de sens avec le carrousel jour par jour).
  const dayRangeLabel = useMemo(
    () => selected.toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    }),
    [selected],
  );

  // count missions par jour (alimente le badge sous chaque date dans le strip).
  const countsByKey = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of missions) {
      if (!m.scheduled_at) continue;
      const k = new Date(m.scheduled_at).toDateString();
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return map;
  }, [missions]);

  const getDayMeta = (date: Date) => ({
    count: countsByKey.get(date.toDateString()) ?? 0,
  });

  const daysGroups = useMemo<AgendaDayGroup[]>(
    () => buildAgendaDays(missions, today),
    [missions, today, nowTick],
  );

  const selectedKey = selected.toDateString();
  const tomorrow = addDays(today, 1);
  const visibleGroup: AgendaDayGroup = daysGroups.find((g) => g.key === selectedKey) ?? {
    key: selectedKey,
    date: selected,
    label: agendaDayLabel(selected, today, tomorrow),
    events: [],
    count: 0,
    total: 0,
  };

  const removeMission = useDriverAgendaStore((s) => s.removeMission);

  function openDetails(id: string) {
    router.push(`/mission/${id}`);
  }

  function openAddModal(_date: Date) {
    // Pas de creation in-place : on redirige vers l'ecran dedie poster-course
    // (formulaire complet + dictee vocale). L'edition complete par date arrivera
    // dans un round suivant (BottomSheet de creation rapide avec date prefilled).
    router.push('/poster-course');
  }

  // Menu kebab "..." : popup styled (cf. CourseActionsMenu).
  const [menuMission, setMenuMission] = useState<Mission | null>(null);

  function openMenu(id: string) {
    const mission = missions.find((m) => m.id === id);
    if (!mission) return;
    setMenuMission(mission);
  }

  async function handleEdit(m: Mission) {
    // MVP : navigate vers le detail (l'edition complete arrivera via un
    // ecran dedie / BottomSheet dans un round suivant).
    router.push(`/mission/${m.id}`);
  }

  async function handleNoShow(m: Mission, reason: string) {
    try {
      await missionService.markNoShow(m.id, reason);
      removeMission(m.id);
    } catch (err) {
      reportError(err, { tags: { phase: 'agenda-no-show' } });
      Alert.alert(
        'Action impossible',
        err instanceof Error ? err.message : 'Reessaye dans un instant.',
      );
    }
  }

  async function handleCancel(m: Mission, reason: string) {
    try {
      if (isManualMission(m)) {
        await missionService.removeManual(m.id);
      } else {
        await missionService.cancel(m.id, reason);
      }
      removeMission(m.id);
    } catch (err) {
      reportError(err, { tags: { phase: 'agenda-cancel' } });
      Alert.alert(
        'Annulation impossible',
        err instanceof Error ? err.message : 'Reessaye dans un instant.',
      );
    }
  }

  return (
    <View style={{ gap: 14, paddingBottom: 24 }}>
      {/* Day label */}
      <Text style={{ fontSize: 12, color: colors.inkSoft, textTransform: 'capitalize', paddingHorizontal: 2 }}>
        {dayRangeLabel}
      </Text>

      {/* Carrousel : pilule noire fixe au centre, dates qui defilent. */}
      <WeekStrip
        selected={selected}
        onSelectedChange={setSelected}
        minDate={today}
        maxDate={maxDate}
        getDayMeta={getDayMeta}
      />

      {loading ? (
        <View style={{ paddingVertical: 60, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : (
        <AgendaDayBlock
          group={visibleGroup}
          onTap={openDetails}
          onAdd={openAddModal}
          onMenu={openMenu}
        />
      )}

      <CourseActionsMenu
        visible={menuMission !== null}
        mission={menuMission}
        onClose={() => setMenuMission(null)}
        onEdit={handleEdit}
        onCancel={handleCancel}
        onNoShow={handleNoShow}
      />
    </View>
  );
}

// Mission "manuelle" (creee par le chauffeur sans passer par le pool) :
// suppression definitive autorisee. Sinon (mission reseau), l'action remet
// la course AVAILABLE pour qu'un autre chauffeur la prenne.
function isManualMission(m: Mission): boolean {
  return m.shared_by === null && m.client_id === null && m.status === 'ACCEPTED';
}
