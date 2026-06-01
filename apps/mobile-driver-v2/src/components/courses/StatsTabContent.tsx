import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Share, Text, View } from 'react-native';
import type { Mission } from '@taxilink/supabase-types';
import { computeDisplayFare } from '@taxilink/core';
import { missionQueries, reportError } from '@taxilink/services';

import { useAuth } from '@/hooks/useAuth';
import { buildHeatmap } from '@/lib/historyHeatmap';
import { useTheme } from '@/lib/theme';
import { HistoryKpiTiles } from './HistoryKpiTiles';
import { HistoryHeatmap } from './HistoryHeatmap';

type StatsPeriod = 'week' | 'month' | 'quarter' | 'year';

const PERIOD_OPTIONS: { value: StatsPeriod; label: string }[] = [
  { value: 'week', label: '7j' },
  { value: 'month', label: '30j' },
  { value: 'quarter', label: '90j' },
  { value: 'year', label: '12 mois' },
];

const PERIOD_DAYS: Record<StatsPeriod, number> = {
  week: 7,
  month: 30,
  quarter: 90,
  year: 365,
};

function fareValue(m: Mission): number {
  return computeDisplayFare(m as never).value;
}

// Onglet Stats fidèle à apps/web/.../StatsTab.tsx :
// 4 KPI tiles + heatmap 6 mois + sélecteur période + bouton export.
// L'export Excel est stubbé pour l'instant via Share natif RN (CSV en clair) —
// pour un vrai .xlsx il faudra ajouter expo-sharing + expo-file-system.
export function StatsTabContent() {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<StatsPeriod>('month');

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    setLoading(true);
    missionQueries
      .getDoneByDriver(user.id, 5000)
      .then((list) => {
        if (!cancelled) setMissions(list);
      })
      .catch((err) => reportError(err, { tags: { phase: 'stats-fetch' } }))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const range = useMemo(() => {
    const from = new Date(today);
    from.setDate(from.getDate() - PERIOD_DAYS[period]);
    const to = new Date(today);
    to.setHours(23, 59, 59, 999);
    return { from, to };
  }, [period, today]);

  const filtered = useMemo(() => {
    const fromMs = range.from.getTime();
    const toMs = range.to.getTime();
    return missions.filter((m) => {
      const t = new Date(m.completed_at ?? m.scheduled_at).getTime();
      return t >= fromMs && t <= toMs;
    });
  }, [missions, range]);

  const kpi = useMemo(() => {
    const total = filtered.reduce((s, m) => s + fareValue(m), 0);
    const count = filtered.length;
    const avg = count > 0 ? total / count : 0;
    const cpamCount = filtered.filter((m) => m.type === 'CPAM').length;
    const cpamRatio = count > 0 ? Math.round((cpamCount / count) * 100) : 0;
    return { total, count, avgPerRide: avg, cpamRatioPct: cpamRatio };
  }, [filtered]);

  // Heatmap 180j (~6 mois) — densité raisonnable sur écran mobile
  const heatmapCells = useMemo(() => buildHeatmap(missions, 180), [missions]);

  async function handleExport() {
    if (filtered.length === 0) return;
    try {
      const csv = buildCsv(filtered);
      await Share.share({
        message: csv,
        title: `historique-${filtered.length}-courses.csv`,
      });
    } catch (err) {
      reportError(err, { tags: { phase: 'stats-export' } });
      Alert.alert('Export', "Impossible de partager le fichier pour l'instant.");
    }
  }

  if (loading) {
    return (
      <View style={{ paddingVertical: 60, alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  const noData = filtered.length === 0;

  return (
    <View style={{ gap: 14, paddingBottom: 24 }}>
      <HistoryKpiTiles
        total={kpi.total}
        count={kpi.count}
        avgPerRide={kpi.avgPerRide}
        cpamRatioPct={kpi.cpamRatioPct}
      />

      <HistoryHeatmap cells={heatmapCells} />

      {/* Sélecteur de période */}
      <View
        style={{
          borderRadius: 14,
          borderWidth: 1.5,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          padding: 14,
          gap: 12,
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: '800', color: colors.inkSoft, letterSpacing: 0.4 }}>
          PÉRIODE
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {PERIOD_OPTIONS.map(({ value, label }) => (
            <PeriodPill
              key={value}
              label={label}
              active={period === value}
              onPress={() => setPeriod(value)}
            />
          ))}
        </View>

        {/* Bouton export */}
        <View
          style={{
            marginTop: 4,
            height: 48,
            borderRadius: 12,
            backgroundColor: noData ? colors.inkSoft : (isDark ? colors.accent : '#0F0F0F'),
            overflow: 'hidden',
            opacity: noData ? 0.4 : 1,
          }}
        >
          <Pressable
            onPress={handleExport}
            disabled={noData}
            android_ripple={{ color: 'rgba(255,255,255,0.15)' }}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.2 }}>
              Télécharger en Excel ({filtered.length} course{filtered.length > 1 ? 's' : ''})
            </Text>
          </Pressable>
        </View>
      </View>

      {noData && (
        <View
          style={{
            borderRadius: 14,
            borderWidth: 1.5,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            paddingHorizontal: 24,
            paddingVertical: 32,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: '800', color: colors.ink, marginBottom: 4, textAlign: 'center' }}>
            Aucune course sur cette période
          </Text>
          <Text style={{ fontSize: 12.5, color: colors.inkSoft, textAlign: 'center', lineHeight: 18 }}>
            Choisis une plage plus large ou continue à conduire — tes courses s'afficheront ici.
          </Text>
        </View>
      )}
    </View>
  );
}

function PeriodPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors, isDark } = useTheme();
  const activeBg = isDark ? colors.accent : '#0F0F0F';
  return (
    <View
      style={{
        height: 32,
        borderRadius: 999,
        backgroundColor: active ? activeBg : colors.surface,
        borderWidth: 1,
        borderColor: active ? activeBg : colors.border,
        overflow: 'hidden',
      }}
    >
      <Pressable
        onPress={onPress}
        android_ripple={{ color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}
        style={{ flex: 1, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' }}
      >
        <Text style={{ fontSize: 12, fontWeight: '800', color: active ? '#FFFFFF' : colors.ink }}>
          {label}
        </Text>
      </Pressable>
    </View>
  );
}

function buildCsv(missions: Mission[]): string {
  const header = ['Date', 'Heure', 'Type', 'Patient', 'Depart', 'Arrivee', 'Distance (km)', 'Duree (min)', 'Prix (€)', 'Statut'];
  const rows = missions.map((m) => {
    const d = new Date(m.completed_at ?? m.scheduled_at);
    return [
      d.toLocaleDateString('fr-FR'),
      d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      m.type ?? '',
      m.patient_name ?? '',
      m.departure,
      m.destination,
      String(m.distance_km ?? ''),
      String(m.duration_min ?? ''),
      String(fareValue(m)),
      m.no_show ? 'Patient absent' : 'Effectuee',
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';');
  });
  return '﻿' + [header.join(';'), ...rows].join('\r\n');
}
