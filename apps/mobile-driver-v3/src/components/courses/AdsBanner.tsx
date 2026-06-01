import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/icons/Icon';
import { useTheme } from '@/lib/theme';

interface Props {
  activeCount: number;
  stuckCount: number;
  badge: number;
  onPress: () => void;
}

// Banner d'acces a la page "Mes annonces postees" (vue V7). Visible sur l'ecran
// Mes courses sous le hero. Pas de "voir les offres" — V7 elimine l'arbitrage.
export function AdsBanner({ activeCount, stuckCount, badge, onPress }: Props) {
  const { colors, isDark } = useTheme();
  const subtitle = buildSubtitle(activeCount, stuckCount);

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 16,
        marginHorizontal: 16,
        marginTop: 14,
        overflow: 'hidden',
      }}
    >
      <Pressable
        onPress={onPress}
        android_ripple={{ color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: 16,
          paddingVertical: 14,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: isDark ? 'rgba(255,210,63,0.15)' : 'rgba(255,210,63,0.18)',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <Icon name="megaphone" size={18} color={colors.ink} strokeWidth={2.2} />
          {badge > 0 && (
            <View
              style={{
                position: 'absolute',
                top: -4,
                right: -4,
                minWidth: 18,
                height: 18,
                paddingHorizontal: 5,
                borderRadius: 9,
                backgroundColor: colors.danger,
                borderWidth: 2,
                borderColor: colors.bg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 9.5, fontWeight: '900', color: '#FFFFFF' }}>
                {badge > 9 ? '9+' : badge}
              </Text>
            </View>
          )}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: colors.ink }}>
            Mes annonces postées
          </Text>
          <Text numberOfLines={1} style={{ fontSize: 11.5, color: colors.inkSoft, marginTop: 2 }}>
            {subtitle}
          </Text>
        </View>
        <Icon name="chevron-right" size={18} color={colors.inkMuted} strokeWidth={2.4} />
      </Pressable>
    </View>
  );
}

function buildSubtitle(active: number, stuck: number): string {
  if (active === 0) return 'Aucune annonce active';
  const parts: string[] = [`${active} active${active > 1 ? 's' : ''}`];
  if (stuck > 0) parts.push(`${stuck} sans preneur`);
  return parts.join(' · ');
}
