import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import type { Mission } from '@taxilink/supabase-types';
import { earningsService, missionQueries, reportError, type DailyEarningsStats } from '@taxilink/services';
import { computeDisplayFare } from '@taxilink/core';

import { Icon } from '@/components/icons/Icon';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/lib/theme';

interface MonthStats {
  earnings: number;
  count: number;
}

// Page Statistiques dediee accessible via Profil > Mes statistiques.
// Affiche : 4 KPIs (today / hier / cette semaine / ce mois) + sparkline 7 jours
// + breakdown par jour de la semaine. Source = earningsService.getDailyStats
// pour 7j et missionQueries.getForDriver pour le mois en cours.
export default function StatsScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [daily, setDaily] = useState<DailyEarningsStats | null>(null);
  const [month, setMonth] = useState<MonthStats>({ earnings: 0, count: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const [d, doneMissions] = await Promise.all([
          earningsService.getDailyStats(user.id),
          missionQueries.getDoneByDriver(user.id, 500).catch(() => [] as Mission[]),
        ]);
        if (cancelled) return;
        setDaily(d);
        const now = new Date();
        const m = now.getMonth();
        const y = now.getFullYear();
        const inMonth = doneMissions.filter((mi: Mission) => {
          if (!mi.completed_at) return false;
          const c = new Date(mi.completed_at);
          return c.getMonth() === m && c.getFullYear() === y;
        });
        setMonth({
          // GAINS-02 : computeDisplayFare (prix stocke sinon estime), jamais
          // price_eur brut qui est NULL pour ~83% des courses DONE.
          earnings: inMonth.reduce((s: number, mi: Mission) => s + computeDisplayFare(mi).value, 0),
          count: inMonth.length,
        });
      } catch (err) {
        reportError(err, { tags: { phase: 'stats-fetch' } });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const weekEarnings = (daily?.weekSparkline ?? []).reduce((s, b) => s + b.earnings, 0);
  const weekCount = (daily?.weekSparkline ?? []).reduce((s, b) => s + b.count, 0);
  const maxDay = Math.max(1, ...(daily?.weekSparkline ?? []).map((b) => b.earnings));

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 12,
          paddingHorizontal: 16, paddingVertical: 12,
          borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Retour"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMuted }}
        >
          <Icon name="arrow-left" size={18} color={colors.ink} strokeWidth={2} />
        </Pressable>
        <Text style={{ flex: 1, fontSize: 17, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 }}>
          Mes statistiques
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 140, gap: 16 }}
        >
          {/* KPIs principaux 2x2 */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <Kpi label="Aujourd'hui" value={`${Math.round(daily?.todayEarnings ?? 0)} €`} sub={`${daily?.todayCount ?? 0} course${(daily?.todayCount ?? 0) > 1 ? 's' : ''}`} highlight />
            <Kpi label="Hier" value={`${Math.round(daily?.yesterdayEarnings ?? 0)} €`} />
            <Kpi label="Cette semaine" value={`${Math.round(weekEarnings)} €`} sub={`${weekCount} course${weekCount > 1 ? 's' : ''}`} />
            <Kpi label="Ce mois" value={`${Math.round(month.earnings)} €`} sub={`${month.count} course${month.count > 1 ? 's' : ''}`} />
          </View>

          {/* Sparkline 7 jours */}
          <View
            style={{
              borderRadius: 16, borderWidth: 1, borderColor: colors.border,
              backgroundColor: colors.surface, padding: 16,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '900', color: colors.inkSoft, letterSpacing: 0.6, marginBottom: 12 }}>
              7 DERNIERS JOURS
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 100, gap: 6 }}>
              {(daily?.weekSparkline ?? []).map((b) => {
                const ratio = b.earnings / maxDay;
                const h = Math.max(6, Math.round(ratio * 90));
                const d = new Date(b.date);
                const dayLabel = d.toLocaleDateString('fr-FR', { weekday: 'narrow' });
                const isToday = b.date === new Date().toISOString().slice(0, 10);
                return (
                  <View key={b.date} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontSize: 9, fontWeight: '700', color: colors.inkSoft }}>
                      {b.earnings > 0 ? `${Math.round(b.earnings)}` : ''}
                    </Text>
                    <View
                      style={{
                        width: '80%', height: h,
                        backgroundColor: isToday ? colors.brand : colors.surfaceMuted,
                        borderRadius: 4,
                      }}
                    />
                    <Text style={{ fontSize: 10, fontWeight: isToday ? '900' : '600', color: isToday ? colors.ink : colors.inkSoft, textTransform: 'uppercase' }}>
                      {dayLabel}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Resume textuel */}
          <View
            style={{
              borderRadius: 16, borderWidth: 1, borderColor: colors.border,
              backgroundColor: colors.surface, padding: 16, gap: 6,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '900', color: colors.inkSoft, letterSpacing: 0.6, marginBottom: 4 }}>
              MOYENNES
            </Text>
            <StatRow label="Moyenne / course (7j)" value={weekCount > 0 ? `${Math.round(weekEarnings / weekCount)} €` : '—'} />
            <StatRow label="Moyenne / jour (7j)" value={`${Math.round(weekEarnings / 7)} €`} />
            <StatRow label="Meilleur jour (7j)" value={`${Math.round(maxDay)} €`} />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Kpi({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexBasis: '48%', flexGrow: 1,
        backgroundColor: highlight ? colors.brand : colors.surface,
        borderRadius: 16, borderWidth: highlight ? 0 : 1, borderColor: colors.border,
        paddingHorizontal: 14, paddingVertical: 14, gap: 4,
      }}
    >
      <Text style={{ fontSize: 10.5, fontWeight: '900', color: highlight ? '#0F0F0F' : colors.inkSoft, letterSpacing: 0.5 }}>
        {label.toUpperCase()}
      </Text>
      <Text style={{ fontSize: 22, fontWeight: '900', color: highlight ? '#0F0F0F' : colors.ink, letterSpacing: -0.5 }}>
        {value}
      </Text>
      {sub && (
        <Text style={{ fontSize: 11, fontWeight: '700', color: highlight ? '#3A3A3A' : colors.inkMuted }}>
          {sub}
        </Text>
      )}
    </View>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
      <Text style={{ fontSize: 13, color: colors.inkSoft }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: '800', color: colors.ink }}>{value}</Text>
    </View>
  );
}
