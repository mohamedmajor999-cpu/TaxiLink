import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@/lib/theme';

export type SortMode = 'activity' | 'recent' | 'name';

interface Props {
  value: SortMode;
  onChange: (mode: SortMode) => void;
}

const OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'activity', label: 'Plus actifs' },
  { value: 'recent', label: 'Récents' },
  { value: 'name', label: 'A → Z' },
];

// 3 chips pilule pour trier les groupes — réplique apps/web GroupesSortChips.tsx.
// Active = pill noire, inactive = pill blanche bordure beige.
export function GroupesSortChips({ value, onChange }: Props) {
  const { colors, isDark } = useTheme();
  // Chip active noire dans les 2 modes (identité TaxiLink).
  const activeBg = '#0F0F0F';
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
      {OPTIONS.map((o) => {
        const active = o.value === value;
        return (
          <View
            key={o.value}
            style={{
              borderRadius: 999,
              backgroundColor: active ? activeBg : colors.surface,
              borderWidth: 1,
              borderColor: active ? activeBg : colors.border,
              overflow: 'hidden',
            }}
          >
            <Pressable
              onPress={() => onChange(o.value)}
              android_ripple={{ color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={{ paddingHorizontal: 14, paddingVertical: 7 }}
            >
              <Text style={{ fontSize: 12.5, fontWeight: '700', color: active ? '#FFFFFF' : colors.inkMuted }}>
                {o.label}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}
