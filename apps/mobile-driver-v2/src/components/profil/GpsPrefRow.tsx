import { Pressable, Text, View } from 'react-native';
import type { GpsPreference } from '@taxilink/core';

import { Icon } from '@/components/icons/Icon';
import { GMapsIcon, WazeIcon } from './GpsAppIcon';
import { useTheme } from '@/lib/theme';

interface Props {
  value: GpsPreference;
  onChange: (v: GpsPreference) => void;
}

const OPTIONS: ReadonlyArray<{
  value: GpsPreference;
  label: string;
  Icon?: typeof WazeIcon;
}> = [
  { value: 'ask', label: 'Les deux' },
  { value: 'maps', label: 'Maps', Icon: GMapsIcon },
  { value: 'waze', label: 'Waze', Icon: WazeIcon },
];

export function GpsPrefRow({ value, onChange }: Props) {
  const { colors, isDark } = useTheme();
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            backgroundColor: colors.pillBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="navigation" size={18} color={colors.ink} strokeWidth={1.8} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.ink }}>Application GPS</Text>
          <Text numberOfLines={1} style={{ fontSize: 12, color: colors.inkSoft, marginTop: 2 }}>
            Choix proposé au démarrage d'une course
          </Text>
        </View>
      </View>
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: colors.pillBg,
          borderRadius: 12,
          padding: 4,
          gap: 4,
        }}
      >
        {OPTIONS.map((opt) => {
          const active = value === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onChange(opt.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={{
                flex: 1,
                height: 36,
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                // Active : même pattern que ThemeModeRow pour cohérence.
                // bg = colors.bg + bordure brand (surfaceElevated invisible
                // en dark car = pillBg).
                backgroundColor: active ? colors.bg : 'transparent',
                borderWidth: active ? 1.5 : 0,
                borderColor: active ? colors.brand : 'transparent',
                shadowColor: active ? '#000' : undefined,
                shadowOpacity: active ? (isDark ? 0.25 : 0.06) : 0,
                shadowOffset: { width: 0, height: 1 },
                shadowRadius: 2,
                elevation: active ? 1 : 0,
              }}
            >
              {opt.Icon && <opt.Icon size={16} />}
              <Text
                style={{
                  fontSize: 12.5,
                  fontWeight: '700',
                  color: active ? colors.ink : colors.inkMuted,
                }}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
