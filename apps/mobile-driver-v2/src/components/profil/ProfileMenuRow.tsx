import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/icons/Icon';
import { useTheme } from '@/lib/theme';

type Tone = 'default' | 'danger';

interface Props {
  icon: IconName;
  label: string;
  description?: string;
  descriptionWarning?: boolean;
  right?: ReactNode;
  tone?: Tone;
  onPress?: () => void;
  disabled?: boolean;
}

export function ProfileMenuRow({
  icon,
  label,
  description,
  descriptionWarning,
  right,
  tone = 'default',
  onPress,
  disabled,
}: Props) {
  const { colors, isDark } = useTheme();
  // En dark mode, colors.dangerSoft (#4A1F1F) est trop foncé/terne sur fond
  // sombre — ressemble à du brun et n'attire pas l'œil. On passe sur un wash
  // translucide du danger clair (#F87171 à 12-22%) qui ressort comme un
  // accent rouge net sur le bg dark sans saturer.
  const palette = {
    default: {
      bg: colors.surface,
      border: colors.border,
      iconBg: colors.pillBg,
      iconColor: colors.ink,
      label: colors.ink,
      desc: colors.inkSoft,
    },
    danger: {
      bg: isDark ? 'rgba(248, 113, 113, 0.12)' : colors.dangerSoft,
      border: isDark ? 'rgba(248, 113, 113, 0.45)' : 'rgba(163,45,45,0.25)',
      iconBg: isDark ? 'rgba(248, 113, 113, 0.22)' : 'rgba(163,45,45,0.15)',
      iconColor: colors.danger,
      label: colors.danger,
      desc: colors.danger,
    },
  } as const;
  const c = palette[tone];
  const showChevron = right === undefined && tone !== 'danger';
  return (
    <View
      style={{
        borderRadius: 16,
        backgroundColor: c.bg,
        borderWidth: 1,
        borderColor: c.border,
        overflow: 'hidden',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <Pressable
        onPress={disabled ? undefined : onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            backgroundColor: c.iconBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={icon} size={18} color={c.iconColor} strokeWidth={1.8} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: c.label, lineHeight: 18 }}>
            {label}
          </Text>
          {description && (
            <Text
              numberOfLines={1}
              style={{
                fontSize: 12,
                color: descriptionWarning ? colors.danger : c.desc,
                fontWeight: descriptionWarning ? '500' : '400',
                marginTop: 2,
              }}
            >
              {description}
            </Text>
          )}
        </View>
        {right}
        {showChevron && <Icon name="chevron-right" size={16} color={colors.inkSoft} strokeWidth={1.8} />}
      </Pressable>
    </View>
  );
}
