import { ActivityIndicator, Animated, Pressable, Text, View } from 'react-native';
import type { Mission } from '@taxilink/supabase-types';
import { computeDisplayFare } from '@taxilink/core';

import { Icon } from '@/components/icons/Icon';
import { useHoldAccept } from '@/hooks/useHoldAccept';
import { useTheme } from '@/lib/theme';

const URGENT_THRESHOLD_MIN = 10;

interface Props {
  mission: Mission;
  userCoords: { lat: number; lng: number } | null;
  bottom: number;
  accepting: boolean;
  onAccept: () => void;
  onShowDetail: () => void;
  onClose: () => void;
}

// Popup flottante affichée au-dessus de la map quand une mission est sélectionnée
// et que le sheet est replié (12% snap). Reprise fidèle de PWA MissionMapPopup.tsx.
// Skip les features autoDismiss/ownMission de la PWA pour cette étape.
export function MissionMapPopup({
  mission,
  userCoords,
  bottom,
  accepting,
  onAccept,
  onShowDetail,
  onClose,
}: Props) {
  const { colors, isDark } = useTheme();
  const minutesUntil = mission.scheduled_at
    ? Math.round((new Date(mission.scheduled_at).getTime() - Date.now()) / 60000)
    : Infinity;
  const urgent = minutesUntil <= URGENT_THRESHOLD_MIN;
  const isCpam = mission.type === 'CPAM';
  const typeLabel = isCpam ? 'CPAM' : 'Privé';
  // Tarif affiché : price_eur si saisi, sinon estimation CPAM/Marseille (PWA-faithful)
  const fare = computeDisplayFare(mission as never).value;

  const pickupKm =
    userCoords && mission.departure_lat != null && mission.departure_lng != null
      ? haversineKm(userCoords, { lat: mission.departure_lat, lng: mission.departure_lng })
      : null;
  const courseKm = mission.distance_km;

  // Hold-to-confirm 1250ms (PWA-faithful). Désactivé pendant accepting (call Supabase en cours).
  const hold = useHoldAccept({ onConfirm: onAccept, duration: 1250, disabled: accepting });
  const holdLabel =
    hold.state === 'confirmed' ? 'Course acceptée' : hold.state === 'pressing' ? 'Maintenez…' : 'Accepter la course';
  const fillWidth = hold.progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 12,
        right: 12,
        bottom,
        zIndex: 1100,
      }}
    >
      <View
        style={{
          backgroundColor: colors.surfaceElevated,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 16,
          shadowColor: '#000',
          shadowOpacity: isDark ? 0.55 : 0.18,
          shadowRadius: 30,
          shadowOffset: { width: 0, height: -8 },
          elevation: 8,
        }}
      >
        {/* Close X */}
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Fermer"
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: colors.surfaceMuted,
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.ink, lineHeight: 16 }}>×</Text>
        </Pressable>

        {/* Header : route + badge + price + distances */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingRight: 30 }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            {/* Départ */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.ink, marginRight: 12 }} />
              <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: '600', color: colors.ink, flex: 1 }}>
                {mission.departure}
              </Text>
            </View>
            <View style={{ width: 2, height: 14, backgroundColor: colors.border, marginLeft: 4, marginVertical: 1 }} />
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
              <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: '500', color: colors.inkSoft, flex: 1 }}>
                {mission.destination}
              </Text>
            </View>

            {/* Badge + heure + urgent */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, marginLeft: 22 }}>
              <View
                style={{
                  paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
                  backgroundColor: isCpam ? colors.dangerSoft : colors.accentSoft,
                }}
              >
                <Text
                  style={{
                    fontSize: 10.5, fontWeight: '800', letterSpacing: 0.4,
                    color: isCpam ? colors.danger : colors.accent,
                  }}
                >
                  {typeLabel.toUpperCase()}
                </Text>
              </View>
              <Text style={{ fontSize: 12, fontWeight: '700', marginLeft: 6, color: colors.inkMuted }}>
                · {minutesUntil <= 0 ? 'Maintenant' : `Dans ${formatDuration(minutesUntil)}`}
              </Text>
              {urgent && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 6, gap: 2 }}>
                  <Icon name="zap" size={11} color={colors.danger} />
                  <Text style={{ fontSize: 11, fontWeight: '800', color: colors.danger }}>Urgent</Text>
                </View>
              )}
            </View>
          </View>

          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: colors.ink, letterSpacing: -0.5 }}>
              {fare.toFixed(2).replace('.', ',')} €
            </Text>
            {pickupKm != null && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Icon name="map-pin" size={13} color={colors.inkSoft} strokeWidth={2.2} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.inkSoft }}>
                  {pickupKm < 10 ? pickupKm.toFixed(1) : pickupKm.toFixed(0)} km
                </Text>
              </View>
            )}
            {courseKm != null && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Icon name="route" size={13} color={colors.ink} strokeWidth={2.2} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.ink }}>
                  {courseKm < 10 ? courseKm.toFixed(1) : courseKm.toFixed(0)} km
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Actions — Accept jaune dashed (2/3) + Détail blanc (1/3). View = visuel + centrage, Pressable invisible par-dessus pour le touch. */}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
          {/* Accept — rectangle noir classique sans icône, texte blanc plus gros, hold-to-confirm 1.25s */}
          <View style={{ flex: 2, height: 52, borderRadius: 12, overflow: 'hidden' }}>
            {/* Background noir/accent solide. En dark on bascule sur l'accent bleu Tesla. */}
            <View
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                borderRadius: 12,
                backgroundColor: isDark ? colors.accent : '#0F0F0F',
              }}
            />
            {/* Progress fill : jaune brand sur fond noir (light) ou blanc sur
                fond bleu (dark) → contraste fort dans les deux modes. En dark
                on NE peut PAS utiliser colors.brand car il vaut #3B82F6 =
                identique à colors.accent (fond bouton) → fill invisible. */}
            <Animated.View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: 0, left: 0, bottom: 0,
                width: fillWidth,
                backgroundColor: isDark ? '#FFFFFF' : colors.brand,
                opacity: isDark ? 0.32 : 0.45,
              }}
            />
            {/* Label centré, sans icône, plus gros (15pt vs 12.5 précédemment) */}
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 10,
              }}
            >
              {accepting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text
                  numberOfLines={1}
                  style={{ fontSize: 15, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.3 }}
                >
                  {holdLabel}
                </Text>
              )}
            </View>
            {/* Pressable invisible : capte le hold (onPressIn/Out) */}
            <Pressable
              onPressIn={hold.start}
              onPressOut={hold.cancel}
              disabled={accepting}
              accessibilityRole="button"
              accessibilityLabel="Maintenir pour accepter la course"
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                borderRadius: 12,
              }}
            />
          </View>

          {/* Détail — 1/3, wrapper View visuel + Pressable interne static (fiable Android) */}
          <View
            style={{
              flex: 1,
              height: 52,
              borderRadius: 12,
              backgroundColor: colors.surfaceElevated,
              borderWidth: 2,
              borderColor: colors.border,
              overflow: 'hidden',
            }}
          >
            <Pressable
              onPress={onShowDetail}
              accessibilityRole="button"
              accessibilityLabel="Voir le détail"
              android_ripple={{ color: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)' }}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                numberOfLines={1}
                style={{ fontSize: 15, fontWeight: '900', color: colors.ink, letterSpacing: -0.3 }}
              >
                Détail
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
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

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h < 24) return m === 0 ? `${h}h` : `${h}h ${m}`;
  const d = Math.floor(h / 24);
  const remH = h % 24;
  return remH === 0 ? `${d}j` : `${d}j ${remH}h`;
}
