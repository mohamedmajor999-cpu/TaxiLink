import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/icons/Icon';
import { useTheme } from '@/lib/theme';
import type { DocumentStatus } from './useDocumentsScreen';

interface Props {
  label: string;
  status: DocumentStatus;
  expiryLabel: string | null;
  cta?: string;
  uploading?: boolean;
  onPress?: () => void;
}

interface StatusVisual {
  bg: string;
  fg: string;
  label: string;
  icon: IconName;
}

function statusVisual(
  status: DocumentStatus,
  colors: ReturnType<typeof useTheme>['colors'],
  isDark: boolean,
): StatusVisual {
  switch (status) {
    case 'valid':
      return {
        bg: isDark ? '#143524' : '#DCFCE7',
        fg: colors.success,
        label: 'Valide',
        icon: 'check',
      };
    case 'expiring':
      return {
        bg: isDark ? '#3F2D11' : '#FEF3C7',
        fg: isDark ? '#FCD34D' : '#92400E',
        label: 'Expire bientôt',
        icon: 'clock',
      };
    case 'expired':
      return { bg: colors.dangerSoft, fg: colors.danger, label: 'Expiré', icon: 'shield-alert' };
    case 'pending':
      return { bg: colors.pillBg, fg: colors.inkMuted, label: 'En vérification', icon: 'clock' };
    case 'invalid':
      return { bg: colors.dangerSoft, fg: colors.danger, label: 'Refusé', icon: 'x' };
    case 'missing':
      return { bg: colors.pillBg, fg: colors.inkMuted, label: 'À fournir', icon: 'plus' };
  }
}

export function DocumentRow({ label, status, expiryLabel, cta, uploading, onPress }: Props) {
  const { colors, isDark } = useTheme();
  const v = statusVisual(status, colors, isDark);
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      <Pressable
        onPress={uploading ? undefined : onPress}
        accessibilityRole="button"
        accessibilityLabel={`${label} — ${v.label}`}
        android_ripple={{ color: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
          opacity: uploading ? 0.6 : 1,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            backgroundColor: v.bg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {uploading ? (
            <ActivityIndicator size="small" color={v.fg} />
          ) : (
            <Icon name={v.icon} size={16} color={v.fg} strokeWidth={2} />
          )}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.ink, lineHeight: 18 }}>{label}</Text>
          <Text numberOfLines={1} style={{ fontSize: 12, color: colors.inkSoft, marginTop: 2 }}>
            {uploading ? 'Envoi en cours…' : expiryLabel ? `Expire le ${expiryLabel}` : cta ?? '—'}
          </Text>
        </View>
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 999,
            backgroundColor: v.bg,
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: '700', color: v.fg }}>{v.label}</Text>
        </View>
      </Pressable>
    </View>
  );
}
