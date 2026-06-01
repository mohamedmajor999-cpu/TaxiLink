import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icons/Icon';
import { useTheme } from '@/lib/theme';

interface Props {
  isOnline: boolean;
  count: number;
  initials: string;
  nightActive: boolean;
  onToggleOnline: () => void;
  onToggleNight: () => void;
  onProfile: () => void;
  // GAINS-01 : gain du jour. null = masque (pas encore charge / erreur).
  todayEarnings?: number | null;
  todayCount?: number;
  onEarnings?: () => void;
}

export function DriverHomeTopBar({
  isOnline,
  count,
  initials,
  nightActive,
  onToggleOnline,
  onToggleNight,
  onProfile,
  todayEarnings = null,
  todayCount = 0,
  onEarnings,
}: Props) {
  const { colors, isDark } = useTheme();
  const floatShadow = {
    shadowColor: '#000',
    shadowOpacity: isDark ? 0.55 : 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  };
  const chipBg = colors.surfaceElevated;
  const chipInk = colors.ink;

  return (
    <SafeAreaView edges={['top']} pointerEvents="box-none" style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
      <View
        pointerEvents="box-none"
        style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 8 }}
      >
        <Pressable onPress={onToggleOnline} style={{ flexShrink: 0 }}>
          <View
            style={{
              flexDirection: 'row', alignItems: 'center',
              paddingLeft: 12, paddingRight: 4, height: 42, borderRadius: 21,
              backgroundColor: isOnline ? (isDark ? colors.accent : '#0F0F0F') : chipBg,
              borderWidth: !isOnline && isDark ? 1 : 0, borderColor: colors.border,
              ...floatShadow,
            }}
          >
            <View
              style={{
                width: 8, height: 8, borderRadius: 4, marginRight: 8,
                backgroundColor: isOnline ? '#34D399' : colors.inkSoft,
              }}
            />
            <Text
              numberOfLines={1}
              style={{
                color: isOnline ? '#FFFFFF' : chipInk,
                fontSize: 13, fontWeight: '800', letterSpacing: -0.2,
              }}
            >
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </Text>
            <View
              style={{
                minWidth: 24, height: 24, paddingHorizontal: 6, marginLeft: 8, borderRadius: 12,
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: isOnline ? 'rgba(255,255,255,0.22)' : colors.surfaceMuted,
              }}
            >
              <Text style={{ fontSize: 11.5, fontWeight: '900', color: isOnline ? '#FFFFFF' : chipInk }}>
                {count}
              </Text>
            </View>
          </View>
        </Pressable>

        {todayEarnings != null && (
          <Pressable onPress={onEarnings} style={{ flexShrink: 1, marginLeft: 8 }}>
            <View
              style={{
                flexDirection: 'row', alignItems: 'center',
                height: 42, paddingHorizontal: 12, borderRadius: 21,
                backgroundColor: chipBg,
                borderWidth: isDark ? 1 : 0, borderColor: colors.border,
                ...floatShadow,
              }}
            >
              <Text numberOfLines={1} style={{ color: chipInk, fontSize: 13, fontWeight: '900', letterSpacing: -0.2 }}>
                {Math.round(todayEarnings)} €
              </Text>
              {todayCount > 0 && (
                <Text numberOfLines={1} style={{ color: colors.inkSoft, fontSize: 11.5, fontWeight: '700', marginLeft: 6 }}>
                  · {todayCount}
                </Text>
              )}
            </View>
          </Pressable>
        )}

        <View style={{ flex: 1 }} />

        <Pressable onPress={onToggleNight} style={{ marginRight: 8 }}>
          <View
            style={{
              width: 42, height: 42, borderRadius: 21,
              backgroundColor: chipBg,
              borderWidth: isDark ? 1 : 0, borderColor: colors.border,
              alignItems: 'center', justifyContent: 'center',
              ...floatShadow,
            }}
          >
            <Icon name={nightActive ? 'moon' : 'sun'} size={16} color={chipInk} />
          </View>
        </Pressable>

        <Pressable onPress={onProfile}>
          <View
            style={{
              width: 42, height: 42, borderRadius: 21,
              backgroundColor: isDark ? colors.accent : '#0F0F0F',
              alignItems: 'center', justifyContent: 'center',
              ...floatShadow,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '900', letterSpacing: -0.3 }}>{initials}</Text>
          </View>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
