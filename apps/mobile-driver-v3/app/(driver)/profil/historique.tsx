import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import type { Mission } from '@taxilink/supabase-types';
import { missionQueries, reportError } from '@taxilink/services';
import { computeDisplayFare } from '@taxilink/core';

import { Icon } from '@/components/icons/Icon';
import { LoadErrorState } from '@/components/LoadErrorState';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/lib/theme';

// GAINS-03 : historique des courses terminees (DONE), regroupees par jour.
// L'onglet "Mes courses" exclut les DONE ; sans cet ecran le chauffeur ne peut
// jamais revoir une course passee (compta perso, litiges CPAM).
interface DayGroup {
  key: string;
  label: string;
  total: number;
  items: Mission[];
}

function localDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function dayLabel(d: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - day.getTime()) / 86_400_000);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return 'Hier';
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function groupByDay(missions: Mission[]): DayGroup[] {
  const sorted = [...missions]
    .filter((m) => m.completed_at)
    .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime());
  const map = new Map<string, DayGroup>();
  for (const m of sorted) {
    const d = new Date(m.completed_at!);
    const key = localDayKey(d);
    let g = map.get(key);
    if (!g) {
      g = { key, label: dayLabel(d), total: 0, items: [] };
      map.set(key, g);
    }
    g.items.push(m);
    if (!m.no_show) g.total += computeDisplayFare(m).value;
  }
  return Array.from(map.values());
}

export default function HistoriqueScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [missions, setMissions] = useState<Mission[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    const uid = user?.id;
    if (!uid) return;
    setError(false);
    setMissions(null);
    missionQueries
      .getDoneByDriver(uid, 200)
      .then((list) => setMissions(list))
      .catch((err) => {
        reportError(err, { tags: { phase: 'history-fetch' } });
        setError(true);
      });
  }, [user?.id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const groups = useMemo(() => groupByDay(missions ?? []), [missions]);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 12,
          paddingHorizontal: 16, paddingVertical: 12,
          borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface,
        }}
      >
        <View style={{ width: 40, height: 40, borderRadius: 20, overflow: 'hidden', backgroundColor: colors.surfaceMuted }}>
          <Pressable
            onPress={() => router.back()}
            accessibilityLabel="Retour"
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="arrow-left" size={18} color={colors.ink} strokeWidth={2} />
          </Pressable>
        </View>
        <Text style={{ flex: 1, fontSize: 17, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 }}>
          Historique des courses
        </Text>
      </View>

      {error ? (
        <LoadErrorState onRetry={load} />
      ) : missions === null ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : groups.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10 }}>
          <Icon name="clock" size={34} color={colors.inkSoft} strokeWidth={1.6} />
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink, textAlign: 'center' }}>
            Aucune course terminée
          </Text>
          <Text style={{ fontSize: 13, color: colors.inkSoft, textAlign: 'center', lineHeight: 19 }}>
            Tes courses terminées apparaîtront ici, jour par jour.
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 120, gap: 18 }}
        >
          {groups.map((g) => (
            <View key={g.key}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, paddingBottom: 8 }}>
                <Text style={{ fontSize: 12, fontWeight: '900', color: colors.inkSoft, letterSpacing: 0.4, textTransform: 'capitalize' }}>
                  {g.label}
                </Text>
                <Text style={{ fontSize: 13, fontWeight: '900', color: colors.ink }}>
                  {Math.round(g.total)} € · {g.items.length}
                </Text>
              </View>
              <View style={{ borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, overflow: 'hidden' }}>
                {g.items.map((m, i) => (
                  <HistoryRow key={m.id} mission={m} isLast={i === g.items.length - 1} />
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function HistoryRow({ mission, isLast }: { mission: Mission; isLast: boolean }) {
  const { colors } = useTheme();
  const time = mission.completed_at
    ? new Date(mission.completed_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : '—';
  const fare = Math.round(computeDisplayFare(mission).value);
  return (
    <View
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 14, paddingVertical: 12,
        borderBottomWidth: isLast ? 0 : 1, borderBottomColor: colors.borderSoft,
      }}
    >
      <View style={{ width: 44 }}>
        <Text style={{ fontSize: 12, fontWeight: '800', color: colors.inkMuted }}>{time}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={{ fontSize: 13.5, fontWeight: '700', color: colors.ink }}>
          {mission.departure ?? '—'}
        </Text>
        <Text numberOfLines={1} style={{ fontSize: 12, color: colors.inkSoft, marginTop: 1 }}>
          → {mission.destination ?? '—'}
        </Text>
      </View>
      {mission.no_show ? (
        <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: colors.dangerSoft }}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: colors.danger }}>Absent</Text>
        </View>
      ) : (
        <Text style={{ fontSize: 15, fontWeight: '900', color: colors.ink }}>{fare} €</Text>
      )}
    </View>
  );
}

