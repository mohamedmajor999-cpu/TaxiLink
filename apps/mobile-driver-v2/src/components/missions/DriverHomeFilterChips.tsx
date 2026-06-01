import { Pressable, Text, View } from 'react-native';
// IMPORTANT : ScrollView de react-native-gesture-handler (pas celui de
// react-native) — c'est le seul qui coexiste proprement avec les gestes
// verticaux de gorhom BottomSheet. Avec le ScrollView standard, le sheet
// avale les swipes horizontaux et les chips de droite (« Urgent », « < 5 km »)
// restent inatteignables.
import { ScrollView } from 'react-native-gesture-handler';

import { Icon } from '@/components/icons/Icon';
import { useTheme } from '@/lib/theme';

export type HomeTypeFilter = 'ALL' | 'CPAM' | 'PRIVE';

export const HOME_TYPE_FILTERS: { key: HomeTypeFilter; label: string }[] = [
  { key: 'ALL', label: 'Tout' },
  { key: 'CPAM', label: 'Médical' },
  { key: 'PRIVE', label: 'Privé' },
];

interface Props {
  filter: HomeTypeFilter;
  counts: Record<HomeTypeFilter, number>;
  urgentOnly: boolean;
  nearbyOnly: boolean;
  hasUserCoords: boolean;
  floating?: boolean;
  onFilterChange: (key: HomeTypeFilter) => void;
  onUrgentToggle: () => void;
  onNearbyToggle: () => void;
}

export function DriverHomeFilterChips({
  filter, counts, urgentOnly, nearbyOnly, hasUserCoords, floating,
  onFilterChange, onUrgentToggle, onNearbyToggle,
}: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 12 }}
    >
      {HOME_TYPE_FILTERS.map((f) => (
        <Chip
          key={f.key}
          active={filter === f.key}
          onPress={() => onFilterChange(f.key)}
          label={f.label}
          count={counts[f.key]}
          floating={floating}
        />
      ))}
      <Chip
        active={urgentOnly}
        onPress={onUrgentToggle}
        label="Urgent"
        icon="zap"
        floating={floating}
      />
      {hasUserCoords && (
        <Chip
          active={nearbyOnly}
          onPress={onNearbyToggle}
          label="< 5 km"
          floating={floating}
        />
      )}
    </ScrollView>
  );
}

function Chip({
  active, onPress, label, count, icon, floating,
}: {
  active: boolean;
  onPress: () => void;
  label: string;
  count?: number;
  icon?: 'zap';
  floating?: boolean;
}) {
  const { colors, isDark } = useTheme();
  // Active : noir #0F0F0F en clair (contraste maxi), accent bleu Tesla en dark
  // (cohérent avec l'avatar et le FAB). Inactive : surface élevée + bordure.
  const activeBg = isDark ? colors.accent : '#0F0F0F';
  const activeInk = '#FFFFFF';
  const inactiveBg = colors.surfaceElevated;
  const inactiveInk = colors.ink;
  const inactiveBorder = colors.border;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: active }} style={{ marginRight: 6 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: 34,
          paddingHorizontal: 12,
          borderRadius: 17,
          backgroundColor: active ? activeBg : inactiveBg,
          borderWidth: 1,
          borderColor: active ? activeBg : inactiveBorder,
          ...(floating
            ? {
                shadowColor: '#000',
                shadowOpacity: isDark ? 0.5 : 0.18,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
                elevation: 4,
              }
            : null),
        }}
      >
        {icon === 'zap' && (
          <View style={{ marginRight: 4 }}>
            <Icon name="zap" size={12} color={active ? activeInk : inactiveInk} />
          </View>
        )}
        <Text style={{ fontSize: 12, fontWeight: '700', color: active ? activeInk : inactiveInk }}>
          {label}
        </Text>
        {count != null && (
          <Text
            style={{
              fontSize: 11, fontWeight: '600', marginLeft: 4,
              color: active ? 'rgba(255,255,255,0.7)' : colors.inkMuted,
            }}
          >
            {count}
          </Text>
        )}
      </View>
    </Pressable>
  );
}
