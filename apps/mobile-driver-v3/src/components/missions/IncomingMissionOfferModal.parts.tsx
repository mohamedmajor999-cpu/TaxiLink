import { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Easing, Pressable, Text, View } from 'react-native';
import type { Mission } from '@taxilink/supabase-types';
import { computeDisplayFare } from '@taxilink/core';

import { Icon } from '@/components/icons/Icon';
import type { useTheme } from '@/lib/theme';

// Sous-composants purement presentationnels du modal "Nouvelle mission" V7.
// Extraits du fichier principal pour respecter le seuil 200 lignes par
// composant (CLAUDE.md). Aucune logique metier ici, uniquement du rendu.

type ThemeColors = ReturnType<typeof useTheme>['colors'];

export function NotifHead({ onClose, colors }: { onClose: () => void; colors: ThemeColors }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <PulsingDot color={colors.success} />
        <Text style={{ fontSize: 11.5, fontWeight: '900', color: colors.ink, letterSpacing: 0.6 }}>
          NOUVELLE MISSION
        </Text>
      </View>
      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surfaceMuted, overflow: 'hidden' }}>
        <Pressable
          onPress={onClose}
          android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          accessibilityLabel="Fermer"
        >
          <Icon name="x" size={13} color={colors.ink} strokeWidth={2.4} />
        </Pressable>
      </View>
    </View>
  );
}

function PulsingDot({ color }: { color: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 900, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);
  const ringScale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.6] });
  const ringOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.42, 0] });
  return (
    <View style={{ width: 8, height: 8, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute', width: 8, height: 8, borderRadius: 4,
          backgroundColor: color, opacity: ringOpacity, transform: [{ scale: ringScale }],
        }}
      />
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
    </View>
  );
}

export function PriceRow({ mission, offerDistance, colors }: { mission: Mission; offerDistance: number | null; colors: ThemeColors }) {
  const fare = computeDisplayFare(mission).value;
  const isCpam = mission.type === 'CPAM';
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
      <View>
        <Text style={{ fontSize: 42, fontWeight: '900', color: colors.ink, letterSpacing: -2, lineHeight: 44 }}>
          {fare > 0 ? `${Math.round(fare)} €` : '—'}
        </Text>
        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.inkSoft, marginTop: 4 }}>
          course {isCpam ? 'CPAM' : 'privée'}
        </Text>
      </View>
      {offerDistance != null && (
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 18, fontWeight: '900', color: colors.ink, letterSpacing: -0.5 }}>
            {offerDistance.toFixed(1)} km
          </Text>
          <Text style={{ fontSize: 11.5, fontWeight: '700', color: colors.inkSoft, marginTop: 2 }}>pickup</Text>
        </View>
      )}
    </View>
  );
}

export function TagsRow({ mission, colors, isDark }: { mission: Mission; colors: ThemeColors; isDark: boolean }) {
  const isCpam = mission.type === 'CPAM';
  const minutesUntil = mission.scheduled_at
    ? Math.round((new Date(mission.scheduled_at).getTime() - Date.now()) / 60000)
    : Infinity;
  const urgent = minutesUntil <= 10;
  const time = mission.scheduled_at
    ? new Date(mission.scheduled_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : null;
  return (
    <View style={{ flexDirection: 'row', gap: 6, marginBottom: 14 }}>
      {/* Code couleur unifie : CPAM = rouge medical, PRIVE = bleu passager. */}
      <TagPill
        label={isCpam ? 'CPAM' : 'PRIVÉ'}
        bg={isCpam ? '#FEE2E2' : '#DBEAFE'}
        ink={isCpam ? '#DC2626' : '#2563EB'}
      />
      {urgent && <TagPill label="URGENT" bg={colors.dangerSoft} ink={colors.danger} />}
      {time && (
        <TagPill label={`DÉPART ${time}`} bg={isDark ? colors.surfaceMuted : '#F3F3F3'} ink={colors.inkSoft} />
      )}
    </View>
  );
}

export function TripBlock({ mission, colors }: { mission: Mission; colors: ThemeColors }) {
  return (
    <View
      style={{
        flexDirection: 'row', gap: 12, paddingVertical: 14,
        borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border, marginBottom: 14,
      }}
    >
      <View style={{ alignItems: 'center', paddingTop: 5 }}>
        <View style={{ width: 9, height: 9, borderRadius: 4.5, backgroundColor: colors.ink }} />
        <View style={{ width: 2, height: 22, backgroundColor: colors.border, marginVertical: 3 }} />
        <View
          style={{
            width: 10, height: 10, borderRadius: 5,
            backgroundColor: colors.brand, borderWidth: 2, borderColor: colors.ink,
          }}
        />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ fontSize: 14.5, fontWeight: '900', color: colors.ink, letterSpacing: -0.2 }}>
          {mission.departure.split(',')[0]?.trim() ?? mission.departure}
        </Text>
        <Text numberOfLines={1} style={{ fontSize: 11.5, color: colors.inkSoft, marginTop: 1, marginBottom: 14 }}>
          {mission.departure}
        </Text>
        <Text numberOfLines={1} style={{ fontSize: 14.5, fontWeight: '900', color: colors.ink, letterSpacing: -0.2 }}>
          {mission.destination.split(',')[0]?.trim() ?? mission.destination}
        </Text>
        {(mission.distance_km != null || mission.duration_min != null) && (
          <Text style={{ fontSize: 11.5, color: colors.inkSoft, marginTop: 1 }}>
            {mission.distance_km != null ? `${mission.distance_km} km` : ''}
            {mission.distance_km != null && mission.duration_min != null ? ' · ' : ''}
            {mission.duration_min != null ? `${mission.duration_min} min de trajet` : ''}
          </Text>
        )}
      </View>
    </View>
  );
}

export function PatientRow({ mission, colors, isDark }: { mission: Mission; colors: ThemeColors; isDark: boolean }) {
  const name = mission.patient_name?.trim();
  if (!name) return null;
  const initials = name.split(/\s+/).map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <View
        style={{
          width: 34, height: 34, borderRadius: 17,
          backgroundColor: isDark ? 'rgba(59,130,246,0.2)' : '#DBEAFE',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 12, fontWeight: '900', color: isDark ? '#93C5FD' : '#1E40AF' }}>
          {initials || '··'}
        </Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ fontSize: 13.5, fontWeight: '900', color: colors.ink, letterSpacing: -0.1 }}>
          {name}
        </Text>
        {mission.notes && (
          <Text numberOfLines={1} style={{ fontSize: 11.5, color: colors.inkSoft, marginTop: 1 }}>
            {mission.notes}
          </Text>
        )}
      </View>
    </View>
  );
}

export function SecondaryButton({
  icon, label, onPress, disabled, colors, isDark,
}: {
  icon: 'x' | 'info'; label: string; onPress: () => void; disabled: boolean;
  colors: ThemeColors; isDark: boolean;
}) {
  return (
    <View style={{ flex: 1, height: 46, borderRadius: 14, backgroundColor: colors.surfaceMuted, overflow: 'hidden', opacity: disabled ? 0.5 : 1 }}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        android_ripple={{ color: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
      >
        <Icon name={icon} size={15} color={colors.ink} strokeWidth={2.4} />
        <Text style={{ fontSize: 14, fontWeight: '900', color: colors.ink, letterSpacing: -0.1 }}>{label}</Text>
      </Pressable>
    </View>
  );
}

export function PrimaryAcceptButton({
  onPress, loading, secondsLeft, colors, isDark,
}: {
  onPress: () => void; loading: boolean; secondsLeft: number;
  colors: ThemeColors; isDark: boolean;
}) {
  return (
    <View style={{ height: 56, borderRadius: 16, backgroundColor: isDark ? colors.accent : '#0F0F0F', overflow: 'hidden' }}>
      <Pressable
        onPress={onPress}
        disabled={loading}
        android_ripple={{ color: 'rgba(255,255,255,0.18)' }}
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 20 }}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Text style={{ fontSize: 16.5, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.2 }}>
              Accepter la course
            </Text>
            <View
              style={{
                backgroundColor: 'rgba(255,255,255,0.18)',
                paddingHorizontal: 10, paddingVertical: 4,
                borderRadius: 999, minWidth: 36, alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 12.5, fontWeight: '900', color: '#FFFFFF' }}>{secondsLeft}s</Text>
            </View>
          </>
        )}
      </Pressable>
    </View>
  );
}

export function CountdownBar({
  sentAt, expiresAt, secondsLeft, colors,
}: {
  sentAt: string; expiresAt: string; secondsLeft: number; colors: ThemeColors;
}) {
  const totalDuration = Math.max(1, Math.round((new Date(expiresAt).getTime() - new Date(sentAt).getTime()) / 1000));
  const progressPct = Math.max(0, Math.min(100, (secondsLeft / totalDuration) * 100));
  const widthAnim = useRef(new Animated.Value(progressPct)).current;
  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: progressPct, duration: 1000,
      easing: Easing.linear, useNativeDriver: false,
    }).start();
  }, [progressPct, widthAnim]);
  const widthStyle = widthAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });
  return (
    <View style={{ height: 3, backgroundColor: colors.surfaceMuted, borderRadius: 2, marginTop: 12, overflow: 'hidden' }}>
      <Animated.View style={{ height: '100%', backgroundColor: colors.ink, borderRadius: 2, width: widthStyle }} />
    </View>
  );
}

function TagPill({ label, bg, ink }: { label: string; bg: string; ink: string }) {
  return (
    <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: bg }}>
      <Text style={{ fontSize: 10.5, fontWeight: '900', color: ink, letterSpacing: 0.4 }}>{label}</Text>
    </View>
  );
}
