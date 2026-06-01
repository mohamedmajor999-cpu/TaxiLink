import { Text, View } from 'react-native';
import { Icon, type IconName } from '@/components/icons/Icon';
import { useTheme } from '@/lib/theme';
import type { UrgencyInfo } from './useNextCourseUrgency';

interface Props {
  urgency: UrgencyInfo;
  patientName?: string | null;
}

// Bandeau contextuel affiche sous le trajet quand on n'est pas en etat 'normal'.
// Donne au chauffeur l'info dont il a besoin AVANT de taper Demarrer :
//   - onsite    : confirmation qu'il est arrive (vert rassurant)
//   - late_far  : distance / ETA pour decider rapidement (orange alerte)
//   - forgotten : alerte forte "tu n'as pas bouge" (rouge urgent)
export function NextCourseUrgencyBanner({ urgency, patientName }: Props) {
  const { isDark } = useTheme();
  const conf = getBannerConfig(urgency, patientName ?? null, isDark);
  if (!conf) return null;

  return (
    <View
      style={{
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 10,
        backgroundColor: conf.bg,
        borderWidth: 1,
        borderColor: conf.border,
      }}
    >
      <Icon name={conf.icon} size={14} color={conf.ink} strokeWidth={2.2} />
      <Text style={{ flex: 1, fontSize: 12, fontWeight: '700', color: conf.ink, lineHeight: 16 }}>
        {conf.message}
      </Text>
    </View>
  );
}

interface BannerConfig {
  bg: string;
  border: string;
  ink: string;
  icon: IconName;
  message: string;
}

function getBannerConfig(
  u: UrgencyInfo,
  name: string | null,
  isDark: boolean,
): BannerConfig | null {
  switch (u.state) {
    case 'onsite':
      return {
        bg: isDark ? 'rgba(34, 197, 94, 0.15)' : '#ECFDF5',
        border: isDark ? 'rgba(34, 197, 94, 0.35)' : '#A7F3D0',
        ink: isDark ? '#86EFAC' : '#047857',
        icon: 'check',
        message: name ? `Tu es sur place — ${name} t'attend` : 'Tu es sur place !',
      };
    case 'late_far': {
      const parts: string[] = [`En retard de ${u.minutesLate} min`];
      if (u.distanceM != null) parts.push(`à ${formatDistance(u.distanceM)}`);
      if (u.etaMin != null) parts.push(`~${u.etaMin} min de route`);
      return {
        bg: isDark ? 'rgba(249, 115, 22, 0.15)' : '#FFF7ED',
        border: isDark ? 'rgba(249, 115, 22, 0.35)' : '#FED7AA',
        ink: isDark ? '#FDBA74' : '#9A3412',
        icon: 'clock',
        message: parts.join(' · '),
      };
    }
    case 'forgotten':
      return {
        bg: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
        border: isDark ? 'rgba(239, 68, 68, 0.35)' : '#FECACA',
        ink: isDark ? '#FCA5A5' : '#B91C1C',
        icon: 'shield-alert',
        message:
          `Retard ${u.minutesLate} min · tu n'as pas bougé` +
          (u.distanceM != null ? ` (à ${formatDistance(u.distanceM)})` : ''),
      };
    default:
      return null;
  }
}

function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}
