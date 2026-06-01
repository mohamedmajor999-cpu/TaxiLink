import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import type { Mission } from '@taxilink/supabase-types';
import { computeDisplayFare } from '@taxilink/core';

import { useTheme } from '@/lib/theme';
import { formatKm } from '@/lib/format';

interface Props {
  missions: Mission[];
  selectedDate: Date;
  excludeIds?: string[];
}

// Liste compacte style Uber driver pour le jour selectionne. Triee par heure.
// Header : "A VENIR · N" + somme des tarifs. Vide → empty state inline.
export function DayCoursesList({ missions, selectedDate, excludeIds = [] }: Props) {
  const { colors } = useTheme();

  const dayMissions = useMemo(() => {
    const day = startOfDay(selectedDate);
    const dayEnd = endOfDay(selectedDate);
    return missions
      .filter((m) => !excludeIds.includes(m.id))
      .filter((m) => {
        if (!m.scheduled_at) return false;
        const t = new Date(m.scheduled_at).getTime();
        return t >= day.getTime() && t <= dayEnd.getTime();
      })
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  }, [missions, selectedDate, excludeIds]);

  const isToday = sameDay(selectedDate, new Date());
  const isFuture = startOfDay(selectedDate).getTime() > startOfDay(new Date()).getTime();
  const headerLabel = isFuture ? 'À VENIR' : isToday ? 'AUJOURD’HUI' : 'CE JOUR';
  const total = dayMissions.reduce((sum, m) => sum + computeDisplayFare(m).value, 0);

  if (dayMissions.length === 0) {
    return (
      <View
        style={{
          marginHorizontal: 16,
          marginTop: 14,
          padding: 24,
          borderRadius: 18,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 14, fontWeight: '800', color: colors.ink }}>
          Aucune course ce jour
        </Text>
        <Text style={{ fontSize: 12, color: colors.inkSoft, marginTop: 4, textAlign: 'center' }}>
          {isFuture ? 'Rien de planifié pour le moment.' : 'Aucune course ce jour-là.'}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        marginHorizontal: 16,
        marginTop: 14,
        borderRadius: 18,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          paddingHorizontal: 18,
          paddingTop: 14,
          paddingBottom: 8,
        }}
      >
        <Text style={{ fontSize: 10.5, fontWeight: '900', color: colors.inkSoft, letterSpacing: 1.2 }}>
          {headerLabel} · {dayMissions.length}
        </Text>
        <Text style={{ fontSize: 13, fontWeight: '900', color: colors.ink, letterSpacing: -0.3 }}>
          {Math.round(total)} €
        </Text>
      </View>
      {dayMissions.map((m, idx) => (
        <Row
          key={m.id}
          mission={m}
          showBorder={idx > 0}
          onPress={() => router.push(`/mission/${m.id}`)}
        />
      ))}
    </View>
  );
}

function Row({ mission, showBorder, onPress }: { mission: Mission; showBorder: boolean; onPress: () => void }) {
  const { colors, isDark } = useTheme();
  const time = mission.scheduled_at
    ? new Date(mission.scheduled_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : '—';
  const fare = computeDisplayFare(mission).value;
  const fromShort = mission.departure.split(',')[0] ?? mission.departure;
  const toShort = mission.destination.split(',')[0] ?? mission.destination;
  const isCpam = mission.type === 'CPAM';

  return (
    <View style={{ borderTopWidth: showBorder ? 1 : 0, borderTopColor: colors.borderSoft }}>
      <Pressable
        onPress={onPress}
        android_ripple={{ color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: 18,
          paddingVertical: 12,
        }}
      >
        <View style={{ width: 48 }}>
          <Text style={{ fontSize: 15, fontWeight: '900', color: colors.ink, letterSpacing: -0.4 }}>
            {time}
          </Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={{ fontSize: 13.5, fontWeight: '700', color: colors.ink, letterSpacing: -0.2 }}>
            {fromShort}
            <Text style={{ fontSize: 11, color: colors.inkMuted, fontWeight: '900' }}> → </Text>
            {toShort}
          </Text>
          <Text numberOfLines={1} style={{ fontSize: 11.5, color: colors.inkSoft, marginTop: 2 }}>
            {mission.patient_name ?? '—'}
            {mission.distance_km != null ? ` · ${formatKm(mission.distance_km)} km` : ''}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 15, fontWeight: '900', color: colors.ink, letterSpacing: -0.4 }}>
            {fare > 0 ? `${Math.round(fare)} €` : '—'}
          </Text>
          <Text
            style={{
              fontSize: 9.5,
              fontWeight: '900',
              color: isCpam ? colors.accent : colors.inkMuted,
              letterSpacing: 0.4,
              marginTop: 1,
            }}
          >
            {isCpam ? 'CPAM' : 'PRIVÉ'}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

function startOfDay(d: Date): Date {
  const n = new Date(d);
  n.setHours(0, 0, 0, 0);
  return n;
}

function endOfDay(d: Date): Date {
  const n = new Date(d);
  n.setHours(23, 59, 59, 999);
  return n;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
