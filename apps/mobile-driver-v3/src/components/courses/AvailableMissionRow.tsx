import { Pressable, Text, View } from 'react-native';
import type { Mission as CoreMission } from '@taxilink/core';

import { Icon } from '@/components/icons/Icon';
import { useTheme } from '@/lib/theme';
import { formatKm, formatDuration } from '@/lib/format';

interface Props {
  mission: CoreMission;
  onPress: () => void;
}

// Carte mission disponible — réplique de MissionSheetItem (apps/web/.../home/).
// Timeline verticale ● │ ◉ a gauche, prix gras a droite, badge type + delai
// colore, distance course en bas. Tap → ouvre l'AvailableMissionSheet.
export function AvailableMissionRow({ mission, onPress }: Props) {
  const { colors, isDark } = useTheme();
  const minutesUntil = Math.round((new Date(mission.scheduledAt).getTime() - Date.now()) / 60000);
  const urgent = minutesUntil <= 10;
  const delayColor = pickDelayColor(minutesUntil, colors.inkSoft);
  const delayLabel = minutesUntil <= 0 ? 'Maintenant' : `Dans ${formatDuration(minutesUntil)}`;
  const isCpam = mission.type === 'CPAM';
  const typeLabel = isCpam ? 'CPAM' : 'PRIVÉ';
  const typeBg = isCpam ? colors.dangerSoft : colors.surfaceMuted;
  const typeInk = isCpam ? colors.danger : colors.inkMuted;

  return (
    <View
      style={{
        marginHorizontal: 16,
        marginBottom: 8,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      <Pressable
        onPress={onPress}
        android_ripple={{ color: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}
        style={{ padding: 14, flexDirection: 'row', gap: 10 }}
        accessibilityLabel={`Course de ${mission.departure} à ${mission.destination}`}
      >
        {/* Bloc adresses + timeline */}
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
            <View style={{ alignItems: 'center', paddingTop: 4 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.ink }} />
              <View style={{ width: 2, height: 14, backgroundColor: colors.border, marginVertical: 2 }} />
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: colors.brand,
                  borderWidth: 2,
                  borderColor: colors.ink,
                }}
              />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                numberOfLines={2}
                style={{ fontSize: 14, fontWeight: '800', color: colors.ink, letterSpacing: -0.2, lineHeight: 18 }}
              >
                {mission.departure}
              </Text>
              <View style={{ height: 8 }} />
              <Text
                numberOfLines={2}
                style={{ fontSize: 14, fontWeight: '600', color: colors.inkSoft, letterSpacing: -0.2, lineHeight: 18 }}
              >
                {mission.destination}
              </Text>
            </View>
          </View>

          {/* Bandeau bas : badge type + delai + urgent */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingLeft: 22 }}>
            <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: typeBg }}>
              <Text style={{ fontSize: 10, fontWeight: '900', color: typeInk, letterSpacing: 0.4 }}>
                {typeLabel}
              </Text>
            </View>
            <Text style={{ fontSize: 11, fontWeight: '700', color: delayColor }}>· {delayLabel}</Text>
            {urgent && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <Icon name="zap" size={11} color={colors.danger} strokeWidth={2.4} />
                <Text style={{ fontSize: 10.5, fontWeight: '900', color: colors.danger, letterSpacing: 0.4 }}>
                  URGENT
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Colonne prix + km */}
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <Text style={{ fontSize: 17, fontWeight: '900', color: colors.ink, letterSpacing: -0.4 }}>
            {mission.priceEur > 0 ? `${formatFare(mission.priceEur)} €` : '—'}
          </Text>
          {mission.distanceKm > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Icon name="route" size={11} color={colors.ink} strokeWidth={2.2} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.ink, letterSpacing: -0.2 }}>
                {formatKm(mission.distanceKm)} km
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    </View>
  );
}

function pickDelayColor(minutes: number, fallback: string): string {
  if (minutes <= 10) return '#EF4444';
  if (minutes < 60) return '#F59E0B';
  if (minutes < 1440) return fallback;
  return fallback;
}

function formatFare(value: number): string {
  return value.toFixed(2).replace('.', ',');
}
