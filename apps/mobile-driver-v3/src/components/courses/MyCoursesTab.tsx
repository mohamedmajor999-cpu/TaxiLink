import { useMemo, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import type { Mission } from '@taxilink/supabase-types';
import { missionProgressMutations, missionService, reportError } from '@taxilink/services';
import { useDriverAgendaStore } from '@taxilink/stores';

import { useTheme } from '@/lib/theme';
import { CourseActionsMenu } from '@/components/courses/CourseActionsMenu';
import { NextCourseHero } from '@/components/courses/NextCourseHero';
import { DateStrip } from '@/components/courses/DateStrip';
import { DayCoursesList } from '@/components/courses/DayCoursesList';

interface Props {
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
}

// Onglet 2 — Mes courses : extrait du contenu de courses.tsx (avant refonte
// 3-tabs). Affiche le hero "Prochaine course" si une mission est IN_PROGRESS,
// la DateStrip avec dots par jour, et la liste compacte du jour selectionne.
export function MyCoursesTab({ selectedDate, onSelectDate }: Props) {
  const { colors } = useTheme();
  const [menuMission, setMenuMission] = useState<Mission | null>(null);
  const removeAgendaMission = useDriverAgendaStore((s) => s.removeMission);
  const missions = useDriverAgendaStore((s) => s.missions);

  const countByDay = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const m of missions) {
      if (!m.scheduled_at) continue;
      const iso = toIso(new Date(m.scheduled_at));
      acc[iso] = (acc[iso] ?? 0) + 1;
    }
    return acc;
  }, [missions]);

  const isViewingToday = sameDay(selectedDate, new Date());
  const currentMission = useMemo(() => {
    if (!isViewingToday) return null;
    return missions.find((m) => m.status === 'IN_PROGRESS') ?? null;
  }, [missions, isViewingToday]);

  async function handleAdvance(m: Mission) {
    try {
      if (m.status === 'IN_PROGRESS' && !m.enroute_at) {
        await missionProgressMutations.markEnRoute(m.id);
      }
      router.push(`/mission/${m.id}/active`);
    } catch (err) {
      reportError(err, { tags: { phase: 'courses-advance' } });
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Réessaie dans un instant.');
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
        {currentMission && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 4 }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: '900',
                color: colors.inkSoft,
                letterSpacing: 1.4,
                paddingHorizontal: 4,
                paddingBottom: 10,
              }}
            >
              EN COURS
            </Text>
            <NextCourseHero
              mission={currentMission}
              onShowMore={() => setMenuMission(currentMission)}
              onAdvanceStep={() => handleAdvance(currentMission)}
            />
          </View>
        )}

        <View style={{ marginTop: 18 }}>
          <DateStrip
            selected={selectedDate}
            onSelect={onSelectDate}
            countByDay={countByDay}
            compactDaysOnly
          />
        </View>

        <DayCoursesList
          missions={missions}
          selectedDate={selectedDate}
          excludeIds={currentMission ? [currentMission.id] : []}
        />
      </ScrollView>

      <CourseActionsMenu
        visible={menuMission !== null}
        mission={menuMission}
        onClose={() => setMenuMission(null)}
        onEdit={(m) => router.push(`/mission/${m.id}`)}
        onNoShow={async (m, reason) => {
          try {
            await missionService.markNoShow(m.id, reason);
            removeAgendaMission(m.id);
          } catch (err) {
            reportError(err, { tags: { phase: 'today-no-show' } });
            Alert.alert(
              'Action impossible',
              err instanceof Error ? err.message : 'Reessaye dans un instant.',
            );
          }
        }}
        onCancel={async (m, reason) => {
          try {
            if (isManualMission(m)) {
              await missionService.removeManual(m.id);
            } else {
              await missionService.cancel(m.id, reason);
            }
            removeAgendaMission(m.id);
          } catch (err) {
            reportError(err, { tags: { phase: 'today-cancel' } });
            Alert.alert(
              'Annulation impossible',
              err instanceof Error ? err.message : 'Reessaye dans un instant.',
            );
          }
        }}
      />
    </View>
  );
}

function isManualMission(m: Mission): boolean {
  return m.shared_by === null && m.client_id === null && m.status === 'ACCEPTED';
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
