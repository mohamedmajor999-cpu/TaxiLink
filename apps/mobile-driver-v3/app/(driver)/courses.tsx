import { useMemo, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDriverAgendaStore, useMissionStore, useUnseenAcceptCount, useUnseenUntakenCount } from '@taxilink/stores';

import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/lib/theme';
import { useDriverAgendaSync } from '@/hooks/useDriverAgendaSync';
import { CoursesTabBar, type CoursesTab } from '@/components/courses/CoursesTabBar';
import { AvailableTab } from '@/components/courses/AvailableTab';
import { MyCoursesTab } from '@/components/courses/MyCoursesTab';
import { AnnoncesTab } from '@/components/courses/AnnoncesTab';
import { useAnnoncesBadgeFetch } from '@/components/courses/useAnnoncesBadgeFetch';

// Page Courses V8 : 3 onglets segmentes en haut (Disponibles / Mes courses /
// Annonces). Le header (titre + badge mégaphone) reste fixe ; le contenu
// change selon l'onglet. L'agenda est sync ici (driver-wide) pour que le badge
// "Mes" reste à jour même si l'utilisateur n'a pas encore tapé sur l'onglet.
export default function CoursesScreen() {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  // Defaut = 'available' (Dispo) : c'est l'onglet que les chauffeurs consultent
  // en priorite (recevoir des courses partagees). Avant : 'mine' obligeait a
  // taper Dispo a chaque ouverture. Demande user 2026-05-25.
  const [tab, setTab] = useState<CoursesTab>('available');
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  // Sync agenda driver-wide (utilise par le badge Mes + l'onglet MyCourses).
  useDriverAgendaSync();
  const agendaMissions = useDriverAgendaStore((s) => s.missions);
  const agendaLoading = useDriverAgendaStore((s) => s.isLoading);

  // Compteur Dispo : on lit le store mission (charge a l'ouverture de l'onglet
  // 1) ; tant qu'il est vide le badge n'apparait pas — c'est OK.
  const availableMissions = useMissionStore((s) => s.missions);
  const availableCount = availableMissions.length;

  // Compteur Annonces : prefetch leger (count uniquement) pour ne pas attendre
  // que l'utilisateur tape sur l'onglet. Idempotent — le fetch detaille de
  // AnnoncesTab utilise le meme RPC et bypass le cache si dispo.
  const annoncesCount = useAnnoncesBadgeFetch(user?.id ?? null);

  const mineCount = useMemo(
    () => agendaMissions.filter((m) => m.status !== 'DONE').length,
    [agendaMissions],
  );

  const unseenAccepts = useUnseenAcceptCount();
  const unseenUntaken = useUnseenUntakenCount();
  const adsBadge = unseenAccepts + unseenUntaken;

  const headerTitle = tab === 'available' ? 'Disponibles' : tab === 'mine' ? 'Mes courses' : 'Annonces';
  const headerSub =
    tab === 'available'
      ? 'Courses partagées par les collègues'
      : tab === 'mine'
        ? formatLongDate(selectedDate)
        : 'Mes annonces postées';

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: 14,
          paddingBottom: 10,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 28, fontWeight: '900', color: colors.ink, letterSpacing: -0.8 }}>
            {headerTitle}
          </Text>
          <Text style={{ fontSize: 13, color: colors.inkSoft, marginTop: 2 }}>{headerSub}</Text>
        </View>
        {adsBadge > 0 && (
          <View
            style={{
              minWidth: 22,
              height: 22,
              paddingHorizontal: 6,
              borderRadius: 11,
              backgroundColor: colors.danger,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 6,
              shadowColor: '#000',
              shadowOpacity: isDark ? 0.4 : 0.12,
              shadowRadius: 4,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '900', color: '#FFFFFF' }}>
              {adsBadge > 9 ? '9+' : adsBadge}
            </Text>
          </View>
        )}
      </View>

      {/* Onglets segmentés */}
      <CoursesTabBar
        tab={tab}
        onChange={setTab}
        counts={{ available: availableCount, mine: mineCount, ads: annoncesCount }}
      />

      {/* Contenu */}
      {tab === 'available' && <AvailableTab />}
      {tab === 'mine' && (
        agendaLoading && agendaMissions.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={colors.brand} />
          </View>
        ) : (
          <MyCoursesTab selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        )
      )}
      {tab === 'ads' && <AnnoncesTab />}
    </SafeAreaView>
  );
}

function formatLongDate(d: Date): string {
  const str = d.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' });
  return str.charAt(0).toUpperCase() + str.slice(1);
}
