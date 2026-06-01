import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/icons/Icon';
import { useTheme } from '@/lib/theme';

export type ThemePref = 'on' | 'off';

interface Props {
  pref: ThemePref;
  onChange: (pref: ThemePref) => void;
}

const OPTIONS: ReadonlyArray<{ value: ThemePref; label: string; icon: 'sun' | 'moon' }> = [
  { value: 'off', label: 'Clair', icon: 'sun' },
  { value: 'on', label: 'Sombre', icon: 'moon' },
];

export function ThemeModeRow({ pref, onChange }: Props) {
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
      {/* Ligne 1 : icone + titre + description (le segmented control prenait
          trop de largeur a droite, "Apparence" wrappait sur 2 lignes — bug
          rapporte 2026-05-23). Meme layout que GpsPrefRow juste a cote. */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
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
          <Icon name={pref === 'on' ? 'moon' : 'sun'} size={18} color={colors.ink} strokeWidth={1.8} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.ink }}>Apparence</Text>
          <Text numberOfLines={1} style={{ fontSize: 12, color: colors.inkSoft, marginTop: 2 }}>
            Choix manuel du mode jour / nuit
          </Text>
        </View>
      </View>

      {/* Ligne 2 : segmented control Clair / Sombre, full width sous le titre. */}
      <View
        style={{
          marginTop: 12,
          flexDirection: 'row',
          backgroundColor: colors.pillBg,
          borderRadius: 10,
          padding: 3,
          gap: 2,
        }}
      >
        {OPTIONS.map((opt) => {
          const active = pref === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onChange(opt.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
              android_ripple={{ color: 'rgba(0,0,0,0.08)', borderless: false }}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                paddingHorizontal: 10,
                height: 38,
                borderRadius: 10,
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
              <Icon name={opt.icon} size={14} color={active ? colors.ink : colors.inkMuted} strokeWidth={1.8} />
              <Text
                style={{
                  fontSize: 13,
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
