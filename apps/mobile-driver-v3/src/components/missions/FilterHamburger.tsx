import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/icons/Icon';
import { useTheme } from '@/lib/theme';

interface Props {
  top: number;
  // Nombre de filtres actifs (hors ALL/all) — affiche en badge sur le bouton.
  activeCount: number;
  onPress: () => void;
}

// Pilule hamburger en haut de la carte. Tape => ouvre le FiltersSheet.
// Badge avec le nombre de filtres actifs visible immediatement.
export function FilterHamburger({ top, activeCount, onPress }: Props) {
  const { colors, isDark } = useTheme();
  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', top, right: 14, zIndex: 5 }}
    >
      <View
        style={{
          height: 38,
          borderRadius: 19,
          backgroundColor: colors.surfaceElevated,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOpacity: isDark ? 0.55 : 0.22,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 5 },
          elevation: 5,
          ...(isDark ? { borderWidth: 1, borderColor: colors.border } : null),
        }}
      >
        <Pressable
          onPress={onPress}
          android_ripple={{ color: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}
          style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, height: 38, gap: 8 }}
        >
          <Icon name="menu" size={16} color={colors.ink} strokeWidth={2.4} />
          <Text style={{ fontSize: 13, fontWeight: '800', color: colors.ink, letterSpacing: -0.1 }}>
            Filtres
          </Text>
          {activeCount > 0 && (
            <View
              style={{
                minWidth: 18, height: 18, borderRadius: 9,
                backgroundColor: isDark ? colors.accent : '#0F0F0F',
                alignItems: 'center', justifyContent: 'center',
                paddingHorizontal: 5,
              }}
            >
              <Text style={{ fontSize: 10.5, fontWeight: '900', color: '#FFFFFF' }}>
                {activeCount}
              </Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}
