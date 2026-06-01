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
  onMenu: () => void;
  onProfile: () => void;
}

export function DriverHomeTopBar({
  isOnline,
  count,
  initials,
  nightActive,
  onToggleOnline,
  onToggleNight,
  onMenu,
  onProfile,
}: Props) {
  const { colors, isDark } = useTheme();
  // Cards flottantes : ombre porte en clair, glow leger sur fond sombre.
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
        style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingTop: 8 }}
      >
        {/* Hamburger menu */}
        <Pressable onPress={onMenu} style={{ marginRight: 6 }}>
          <View
            style={{
              width: 40, height: 40, borderRadius: 20, backgroundColor: chipBg,
              borderWidth: isDark ? 1 : 0, borderColor: colors.border,
              alignItems: 'center', justifyContent: 'center',
              ...floatShadow,
            }}
          >
            <Icon name="menu" size={18} color={chipInk} />
            <View
              style={{
                position: 'absolute', top: 7, right: 8,
                width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.danger,
                borderWidth: 1.5, borderColor: chipBg,
              }}
            />
          </View>
        </Pressable>

        {/* Online toggle pill — single line */}
        <Pressable onPress={onToggleOnline} style={{ flexShrink: 0 }}>
          <View
            style={{
              flexDirection: 'row', alignItems: 'center',
              paddingLeft: 10, paddingRight: 4, height: 40, borderRadius: 20,
              backgroundColor: isOnline ? (isDark ? colors.accent : '#0F0F0F') : chipBg,
              borderWidth: !isOnline && isDark ? 1 : 0, borderColor: colors.border,
              ...floatShadow,
            }}
          >
            <View
              style={{
                width: 7, height: 7, borderRadius: 3.5, marginRight: 6,
                backgroundColor: isOnline ? '#34D399' : colors.inkSoft,
              }}
            />
            <Text
              numberOfLines={1}
              style={{
                color: isOnline ? '#FFFFFF' : chipInk,
                fontSize: 12.5, fontWeight: '700',
              }}
            >
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </Text>
            <View
              style={{
                minWidth: 22, height: 22, paddingHorizontal: 5, marginLeft: 6, borderRadius: 11,
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: isOnline ? 'rgba(255,255,255,0.2)' : colors.surfaceMuted,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '800', color: isOnline ? '#FFFFFF' : chipInk }}>
                {count}
              </Text>
            </View>
          </View>
        </Pressable>

        <View style={{ flex: 1 }} />

        {/* Theme toggle */}
        <Pressable onPress={onToggleNight} style={{ marginRight: 6 }}>
          <View
            style={{
              width: 38, height: 38, borderRadius: 19,
              backgroundColor: chipBg,
              borderWidth: isDark ? 1 : 0, borderColor: colors.border,
              alignItems: 'center', justifyContent: 'center',
              ...floatShadow,
            }}
          >
            <Icon name={nightActive ? 'moon' : 'sun'} size={15} color={chipInk} />
          </View>
        </Pressable>

        {/* Avatar */}
        <Pressable onPress={onProfile}>
          <View
            style={{
              width: 38, height: 38, borderRadius: 19,
              backgroundColor: isDark ? colors.accent : '#0F0F0F',
              alignItems: 'center', justifyContent: 'center',
              ...floatShadow,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 12.5, fontWeight: '800' }}>{initials}</Text>
          </View>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
