import { Pressable, Text, View } from 'react-native';
import type { Mission } from '@taxilink/supabase-types';
import { computeDisplayFare } from '@taxilink/core';

import { Icon } from '@/components/icons/Icon';
import { useTheme } from '@/lib/theme';

const URGENT_THRESHOLD_MIN = 10;

interface Props {
  mission: Mission;
  selected: boolean;
  userCoords: { lat: number; lng: number } | null;
  onSelect?: (id: string) => void;
}

export function MissionSheetItem({ mission, selected, userCoords, onSelect }: Props) {
  const { colors, isDark } = useTheme();
  const minutesUntil = getMinutesUntil(mission.scheduled_at);
  const urgent = minutesUntil <= URGENT_THRESHOLD_MIN;
  const isCpam = mission.type === 'CPAM';
  const typeLabel = isCpam ? 'CPAM' : 'Privé';
  // Tarif affiché : price_eur si saisi, sinon estimation CPAM/Marseille (PWA-faithful)
  const fare = computeDisplayFare(mission as never).value;

  // Distance ta position → départ (haversine). Affichée avec icône map-pin.
  const pickupKm =
    userCoords && mission.departure_lat != null && mission.departure_lng != null
      ? haversineKm(userCoords, { lat: mission.departure_lat, lng: mission.departure_lng })
      : null;
  // Distance départ → destination (Supabase ou haversine fallback).
  const courseKm =
    mission.distance_km != null
      ? mission.distance_km
      : mission.departure_lat != null && mission.departure_lng != null
        && mission.destination_lat != null && mission.destination_lng != null
        ? haversineKm(
            { lat: mission.departure_lat, lng: mission.departure_lng },
            { lat: mission.destination_lat, lng: mission.destination_lng },
          )
        : null;

  return (
    <View
      style={{
        borderRadius: 16,
        backgroundColor: colors.surfaceElevated,
        borderWidth: selected ? 2.5 : 1.5,
        // En light : noir franc pour la sélection, beige warm pour le défaut.
        // En dark : accent bleu Tesla pour la sélection, bordure standard sinon.
        borderColor: selected ? (isDark ? colors.accent : '#0F0F0F') : colors.border,
        shadowColor: '#000',
        shadowOpacity: isDark ? (selected ? 0.55 : 0.25) : (selected ? 0.18 : 0.05),
        shadowRadius: selected ? 14 : 6,
        shadowOffset: { width: 0, height: selected ? 5 : 2 },
        elevation: selected ? 5 : 2,
        overflow: 'hidden',
      }}
      accessibilityState={{ selected }}
    >
      <Pressable
        onPress={() => onSelect?.(mission.id)}
        style={({ pressed }) => ({
          opacity: pressed ? 0.92 : 1,
        })}
      >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 18, paddingVertical: 16 }}>
        {/* Colonne gauche : route + badge */}
        <View style={{ flex: 1, minWidth: 0 }}>
          {/* Départ */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.ink, marginRight: 12 }} />
            <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '600', color: colors.ink, flex: 1 }}>
              {mission.departure}
            </Text>
          </View>
          {/* Trait de liaison */}
          <View style={{ width: 2, height: 12, backgroundColor: colors.border, marginLeft: 4, marginVertical: 1 }} />
          {/* Destination */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 12, height: 12, borderRadius: 6,
                backgroundColor: colors.brand,
                borderWidth: 2, borderColor: colors.ink,
                marginRight: 10, marginLeft: -1,
              }}
            />
            <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '500', color: colors.inkSoft, flex: 1 }}>
              {mission.destination}
            </Text>
          </View>

          {/* Badge + heure + urgent */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, marginLeft: 22 }}>
            <View
              style={{
                paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
                backgroundColor: isCpam ? colors.dangerSoft : colors.accentSoft,
              }}
            >
              <Text
                style={{
                  fontSize: 10, fontWeight: '800', letterSpacing: 0.4,
                  color: isCpam ? colors.danger : colors.accent,
                }}
              >
                {typeLabel.toUpperCase()}
              </Text>
            </View>
            <Text style={{ fontSize: 11, fontWeight: '700', marginLeft: 6, color: delayColor(minutesUntil, colors) }}>
              · {minutesUntil <= 0 ? 'Maintenant' : `Dans ${formatDuration(minutesUntil)}`}
            </Text>
            {urgent && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 6, gap: 2 }}>
                <Icon name="zap" size={11} color={colors.danger} />
                <Text style={{ fontSize: 10.5, fontWeight: '800', color: colors.danger }}>Urgent</Text>
              </View>
            )}
          </View>
        </View>

        {/* Colonne droite : prix + distances */}
        <View style={{ alignItems: 'flex-end', gap: 3 }}>
          <Text style={{ fontSize: 16, fontWeight: '900', color: colors.ink, letterSpacing: -0.3 }}>
            {fare.toFixed(2).replace('.', ',')} €
          </Text>
          {pickupKm != null && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Icon name="map-pin" size={12} color={colors.inkSoft} strokeWidth={2.2} />
              <Text style={{ fontSize: 12.5, fontWeight: '600', color: colors.inkSoft }}>
                {pickupKm < 10 ? pickupKm.toFixed(1) : pickupKm.toFixed(0)} km
              </Text>
            </View>
          )}
          {courseKm != null && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Icon name="route" size={12} color={colors.ink} strokeWidth={2.2} />
              <Text style={{ fontSize: 12.5, fontWeight: '600', color: colors.ink }}>
                {courseKm < 10 ? courseKm.toFixed(1) : courseKm.toFixed(0)} km
              </Text>
            </View>
          )}
        </View>
      </View>
      </Pressable>
    </View>
  );
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

function getMinutesUntil(iso: string | null): number {
  if (!iso) return Infinity;
  return Math.round((new Date(iso).getTime() - Date.now()) / 60000);
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h < 24) return m === 0 ? `${h}h` : `${h}h ${m}`;
  const d = Math.floor(h / 24);
  const remH = h % 24;
  return remH === 0 ? `${d}j` : `${d}j ${remH}h`;
}

function delayColor(minutes: number, colors: { danger: string; ink: string; inkSoft: string }): string {
  if (minutes <= URGENT_THRESHOLD_MIN) return colors.danger;
  if (minutes < 60) return '#F59E0B';
  if (minutes < 1440) return colors.ink;
  return colors.inkSoft;
}
