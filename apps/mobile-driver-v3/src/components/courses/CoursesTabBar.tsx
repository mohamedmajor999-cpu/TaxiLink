import { Pressable, Text, View } from 'react-native';

import { useTheme } from '@/lib/theme';

export type CoursesTab = 'available' | 'mine' | 'ads';

interface Props {
  tab: CoursesTab;
  onChange: (tab: CoursesTab) => void;
  counts: { available: number; mine: number; ads: number };
}

// Segmented control 3 onglets pour la page Courses (Disponibles / Mes courses / Annonces).
// Style cohérent avec l'existant (SegPill de annonces.tsx) : pill noire active +
// pill transparente inactive. Compteur entre parentheses sur chaque onglet.
export function CoursesTabBar({ tab, onChange, counts }: Props) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        marginHorizontal: 16,
        marginBottom: 12,
        padding: 4,
        backgroundColor: colors.surfaceMuted,
        borderRadius: 14,
      }}
    >
      <Segment label="Dispo" count={counts.available} active={tab === 'available'} onPress={() => onChange('available')} />
      <Segment label="Mes" count={counts.mine} active={tab === 'mine'} onPress={() => onChange('mine')} />
      <Segment label="Annonces" count={counts.ads} active={tab === 'ads'} onPress={() => onChange('ads')} />
    </View>
  );
}

function Segment({
  label,
  count,
  active,
  onPress,
}: {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
}) {
  const { colors, isDark } = useTheme();
  const bg = active ? (isDark ? colors.accent : '#0A0A0A') : 'transparent';
  const ink = active ? '#FFFFFF' : colors.inkSoft;
  return (
    <View style={{ flex: 1, height: 38, borderRadius: 10, backgroundColor: bg, overflow: 'hidden' }}>
      <Pressable
        onPress={onPress}
        android_ripple={{ color: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 }}
        accessibilityLabel={`Onglet ${label}`}
        accessibilityState={{ selected: active }}
      >
        <Text style={{ fontSize: 13, fontWeight: '800', color: ink, letterSpacing: -0.1 }}>{label}</Text>
        {count > 0 && (
          <View
            style={{
              minWidth: 18,
              paddingHorizontal: 5,
              height: 16,
              borderRadius: 8,
              backgroundColor: active ? 'rgba(255,255,255,0.22)' : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 10.5, fontWeight: '900', color: ink }}>{count}</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}
