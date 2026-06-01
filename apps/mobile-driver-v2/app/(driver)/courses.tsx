import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import type { Mission } from '@taxilink/supabase-types';
import { computeDisplayFare } from '@taxilink/core';
import { earningsService, type DailyEarningsStats, missionProgressMutations, missionQueries, missionService, reportError } from '@taxilink/services';
import {
  useDriverAgendaStore,
  useUnseenAcceptCount,
  useUnseenUntakenCount,
} from '@taxilink/stores';

import { Icon } from '@/components/icons/Icon';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/hooks/useAuth';
import { useDriverAgendaSync } from '@/hooks/useDriverAgendaSync';
import { useDrawerData } from '@/hooks/useDrawerData';
import { SideBarDrawer } from '@/components/navigation/SideBarDrawer';
import { CourseActionsMenu } from '@/components/courses/CourseActionsMenu';
import { NextCourseHero } from '@/components/courses/NextCourseHero';
import { StatsTabContent } from '@/components/courses/StatsTabContent';
import { AdsTabContent } from '@/components/courses/ads/AdsTabContent';
import { AgendaTabContent } from '@/components/courses/agenda/AgendaTabContent';

type Tab = 'today' | 'agenda' | 'ads' | 'stats';

interface TabSpec {
  key: Tab;
  label: string;
  badge?: number;
}

export default function CoursesScreen() {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const [tab, setTab] = useState<Tab>('today');
  const [recentDone, setRecentDone] = useState<Mission[]>([]);
  const [recentDoneLoading, setRecentDoneLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawer = useDrawerData();
  // Menu kebab "..." sur la carte Aujourd'hui (NextCourseHero).
  const [menuMission, setMenuMission] = useState<Mission | null>(null);
  const removeAgendaMission = useDriverAgendaStore((s) => s.removeMission);
  // Earnings stats (DONE only, cf. earningsService) — source identique au web
  // pour eviter l'asymetrie "today=projection" vs "week=reel" de l'ancien calcul.
  const [earnings, setEarnings] = useState<DailyEarningsStats | null>(null);

  // Agenda + realtime : un seul fetch + sync via store partage. Tous les
  // onglets consomment la meme source que AgendaTabContent.
  useDriverAgendaSync();
  const missions = useDriverAgendaStore((s) => s.missions);
  const agendaLoading = useDriverAgendaStore((s) => s.isLoading);
  const loading = agendaLoading || recentDoneLoading;

  // Badge "Annonces" + dot rouge hamburger : somme des notifs non vues
  // (acceptations recues + courses postees stuck). Alimente par les notifiers
  // realtime/poll (a brancher dans un round suivant).
  const unseenAccepts = useUnseenAcceptCount();
  const unseenUntaken = useUnseenUntakenCount();
  const adsBadge = unseenAccepts + unseenUntaken;

  // Date affichée sous le titre (ex. "Mardi 12 Mai 2026")
  const dateLabel = useMemo(
    () => new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }),
    [],
  );

  // Fetch courses terminees recentes (utilise pour la chip avant refactor,
  // garde pour compat eventuelle d'un autre consommateur).
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    setRecentDoneLoading(true);
    missionQueries
      .getDoneByDriver(user.id, 200)
      .then((done) => {
        if (!cancelled) setRecentDone(done);
      })
      .catch((err) => reportError(err, { tags: { phase: 'courses-fetch-done' } }))
      .finally(() => {
        if (!cancelled) setRecentDoneLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Stats earnings (today / week) — toujours sur status=DONE cote serveur,
  // contrairement a l'ancien calcul local qui sommait l'AGENDA (= courses
  // planifiees, non encaissees). Source unique de verite avec le web.
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    earningsService
      .getDailyStats(user.id)
      .then((s) => {
        if (!cancelled) setEarnings(s);
      })
      .catch((err) => reportError(err, { tags: { phase: 'courses-fetch-earnings' } }));
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Filtres dérivés pour onglet Aujourd'hui
  const today = useMemo(() => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(); end.setHours(23, 59, 59, 999);
    return missions.filter((m) => {
      if (!m.scheduled_at) return false;
      const t = new Date(m.scheduled_at).getTime();
      return t >= start.getTime() && t <= end.getTime();
    });
  }, [missions]);

  // Course en cours (IN_PROGRESS) ou à défaut prochaine course du jour
  const currentOrNext = useMemo(() => {
    const inProgress = missions.find((m) => m.status === 'IN_PROGRESS');
    if (inProgress) return inProgress;
    return today[0] ?? null;
  }, [missions, today]);

  // Earnings : source unique = earningsService (status=DONE uniquement, cote
  // serveur). "aujourd'hui" et "cette semaine" sont desormais COHERENTS : tous
  // les deux reflètent l'argent reellement encaisse (pas les courses planifiees).
  const todayEarnings = earnings?.todayEarnings ?? 0;
  const weekEarnings = useMemo(
    () => (earnings?.weekSparkline ?? []).reduce((sum, d) => sum + d.earnings, 0),
    [earnings],
  );

  // Variante du chip earnings selon l'onglet (today/ads = jour, agenda/stats = semaine)
  const chipVariant: 'today' | 'week' = tab === 'agenda' || tab === 'stats' ? 'week' : 'today';
  const chipValue = chipVariant === 'week' ? weekEarnings : todayEarnings;
  const chipLabel = chipVariant === 'week' ? 'cette semaine' : "aujourd'hui";

  // CTA "Je pars chercher le patient" (depuis NextCourseHero) :
  // pose le timestamp enroute si pas deja fait, puis ouvre l'ecran active
  // (mode plein ecran style Uber avec navigation natif + progress steps).
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

  // Tabs (Annonces : badge = somme des notifs unseen via stores partages)
  const tabs: TabSpec[] = [
    { key: 'today', label: "Aujourd'hui" },
    { key: 'agenda', label: 'Agenda' },
    { key: 'ads', label: 'Annonces', badge: adsBadge },
    { key: 'stats', label: 'Stats' },
  ];

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header haut : hamburger + ligne séparatrice */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.bg,
        }}
      >
        <Pressable
          onPress={() => setDrawerOpen(true)}
          accessibilityLabel="Ouvrir le menu"
          android_ripple={{ color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
          style={{
            width: 40, height: 40, borderRadius: 8,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Icon name="menu" size={20} color={colors.ink} strokeWidth={2.2} />
          {adsBadge > 0 && (
            <View
              style={{
                position: 'absolute',
                top: 7, right: 8,
                width: 7, height: 7, borderRadius: 3.5,
                backgroundColor: colors.danger,
                borderWidth: 1.5, borderColor: colors.bg,
              }}
            />
          )}
        </Pressable>
      </View>

      {/* Section titre : logo TL + Mes courses + date + earnings chip */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: 16,
          paddingTop: 18,
          paddingBottom: 14,
          backgroundColor: colors.bg,
        }}
      >
        {/* Logo TL : identité, reste noir en dark aussi (carre 44x44) */}
        <View
          style={{
            width: 44, height: 44, borderRadius: 8,
            backgroundColor: isDark ? colors.accent : '#0F0F0F',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '900', letterSpacing: -0.3 }}>TL</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.ink }}>Mes courses</Text>
          <Text numberOfLines={1} style={{ fontSize: 12, color: colors.inkSoft, marginTop: 2 }}>
            {dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)}
          </Text>
        </View>
        {/* Earnings pill */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 999,
            // En dark : fond sombre teinté vert avec bordure success.
            backgroundColor: isDark ? '#0F2A1E' : '#F0F9F0',
            borderWidth: 1,
            borderColor: isDark ? '#1F4D38' : '#D1FAE5',
          }}
        >
          <View style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.success, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: colors.success, fontSize: 9, fontWeight: '900' }}>€</Text>
          </View>
          <Text style={{ fontSize: 12.5, fontWeight: '800', color: colors.ink }}>
            {chipValue.toFixed(0)} €
          </Text>
          <Text style={{ fontSize: 11.5, color: colors.inkMuted, fontWeight: '600' }}>· {chipLabel}</Text>
        </View>
      </View>

      {/* 4 tabs */}
      <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingBottom: 16 }}>
        {tabs.map((t) => <TabPill key={t.key} tab={t} active={t.key === tab} onPress={() => setTab(t.key)} />)}
      </View>

      {/* Body */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : (
        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          {tab === 'today' && (
            currentOrNext ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
                <Pressable onPress={() => router.push(`/mission/${currentOrNext.id}`)}>
                  <NextCourseHero
                    mission={currentOrNext}
                    onShowMore={() => setMenuMission(currentOrNext)}
                    onAdvanceStep={() => handleAdvance(currentOrNext)}
                  />
                </Pressable>
                <UpcomingTodayList
                  missions={today.filter((m) => m.id !== currentOrNext.id)}
                  colors={colors}
                />
              </ScrollView>
            ) : (
              <EmptyState title="Aucune course aujourd'hui" sub="Vos courses du jour apparaîtront ici dès que vous en aurez accepté une." />
            )
          )}
          {tab === 'agenda' && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 4 }}>
              <AgendaTabContent />
            </ScrollView>
          )}
          {tab === 'ads' && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 4 }}>
              <AdsTabContent />
            </ScrollView>
          )}
          {tab === 'stats' && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 4 }}>
              <StatsTabContent />
            </ScrollView>
          )}
        </View>
      )}

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

      <SideBarDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeTab="courses"
        onTabChange={(t) => {
          setDrawerOpen(false);
          drawer.handleTabChange(t);
        }}
        onPostCourse={() => {
          setDrawerOpen(false);
          drawer.handlePostCourse();
        }}
        onSignOut={drawer.handleSignOut}
        name={drawer.name}
        initials={drawer.initials}
        groupName={drawer.primaryGroup}
        isOnline={drawer.isOnline}
      />
    </SafeAreaView>
  );
}

function TabPill({ tab, active, onPress }: { tab: TabSpec; active: boolean; onPress: () => void }) {
  const { colors, isDark } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        height: 44,
        borderRadius: 999,
        // Active : noir en light, accent bleu Tesla en dark.
        backgroundColor: active ? (isDark ? colors.accent : '#0F0F0F') : colors.surface,
        borderWidth: active ? 0 : 1,
        borderColor: colors.border,
        overflow: 'hidden',
      }}
    >
      <Pressable
        onPress={onPress}
        android_ripple={{ color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
          paddingHorizontal: 4,
        }}
      >
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.85}
          style={{ fontSize: 11.5, fontWeight: '700', color: active ? '#FFFFFF' : colors.ink, letterSpacing: -0.2 }}
        >
          {tab.label}
        </Text>
        {tab.badge !== undefined && tab.badge > 0 && (
          <View
            style={{
              minWidth: 18, height: 18, paddingHorizontal: 5, borderRadius: 9,
              backgroundColor: colors.brand,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: '800', color: colors.brandInk }}>
              {tab.badge > 99 ? '99+' : tab.badge}
            </Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

function EmptyState({ title, sub }: { title: string; sub: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <Text style={{ fontSize: 16, fontWeight: '800', color: colors.ink, marginBottom: 6, textAlign: 'center' }}>
        {title}
      </Text>
      <Text style={{ fontSize: 13, color: colors.inkSoft, textAlign: 'center', lineHeight: 18 }}>{sub}</Text>
    </View>
  );
}

// Mission "manuelle" (creee par le chauffeur sans passer par le pool) :
// suppression definitive autorisee. Sinon (mission reseau), l'action remet
// la course AVAILABLE pour qu'un autre chauffeur la prenne.
function isManualMission(m: Mission): boolean {
  return m.shared_by === null && m.client_id === null && m.status === 'ACCEPTED';
}

// Liste compacte "À venir" sous le hero : toutes les courses ACCEPTED/IN_PROGRESS
// du jour, triees par heure. Tap → detail. Vide → rien affiche (le hero suffit).
function UpcomingTodayList({
  missions,
  colors,
}: {
  missions: Mission[];
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  const sorted = useMemo(
    () => [...missions].sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()),
    [missions],
  );
  if (sorted.length === 0) return null;

  return (
    <View style={{ marginTop: 18, gap: 8 }}>
      <Text style={{ fontSize: 11, fontWeight: '800', color: colors.inkSoft, letterSpacing: 0.4, paddingHorizontal: 2 }}>
        À VENIR · {sorted.length} course{sorted.length > 1 ? 's' : ''}
      </Text>
      {sorted.map((m) => (
        <UpcomingRow key={m.id} mission={m} colors={colors} />
      ))}
    </View>
  );
}

function UpcomingRow({ mission, colors }: { mission: Mission; colors: ReturnType<typeof useTheme>['colors'] }) {
  const time = mission.scheduled_at
    ? new Date(mission.scheduled_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : '—';
  const fare = computeDisplayFare(mission as never).value;
  const fromShort = mission.departure.split(',')[0] ?? mission.departure;
  const toShort = mission.destination.split(',')[0] ?? mission.destination;
  const isCpam = mission.type === 'CPAM';

  return (
    <View style={{ borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
      <Pressable
        onPress={() => router.push(`/mission/${mission.id}`)}
        android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 12 }}
      >
        {/* Heure */}
        <View style={{ alignItems: 'center', minWidth: 44 }}>
          <Text style={{ fontSize: 15, fontWeight: '900', color: colors.ink, letterSpacing: -0.3 }}>{time}</Text>
          <Text style={{ fontSize: 9.5, fontWeight: '800', color: isCpam ? colors.accent : colors.inkSoft, letterSpacing: 0.4 }}>
            {isCpam ? 'CPAM' : 'PRIVÉ'}
          </Text>
        </View>
        {/* Trajet + patient */}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={{ fontSize: 13.5, fontWeight: '700', color: colors.ink }}>
            {fromShort}
            <Text style={{ color: colors.inkSoft, fontWeight: '400' }}> → </Text>
            {toShort}
          </Text>
          {mission.patient_name && (
            <Text numberOfLines={1} style={{ fontSize: 12, color: colors.inkMuted, marginTop: 2 }}>
              {mission.patient_name}
            </Text>
          )}
        </View>
        {/* Prix */}
        <Text style={{ fontSize: 13.5, fontWeight: '900', color: colors.ink, letterSpacing: -0.3 }}>
          {fare > 0 ? `${fare.toFixed(0)} €` : '—'}
        </Text>
      </Pressable>
    </View>
  );
}

