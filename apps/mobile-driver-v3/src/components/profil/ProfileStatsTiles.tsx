import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Icon } from '@/components/icons/Icon';
import { useTheme } from '@/lib/theme';

interface Props {
  revenue: number;
  courseCount: number;
}

function formatRevenue(value: number): string {
  return `${Math.round(value).toLocaleString('fr-FR')} €`;
}

export function ProfileStatsTiles({ revenue, courseCount }: Props) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => router.push('/profil/stats')}
      accessibilityRole="button"
      accessibilityLabel="Voir mes statistiques detaillees"
      android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
      style={{ marginBottom: 24 }}
    >
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Tile label="Gains ce mois" value={formatRevenue(revenue)} />
        <Tile label="Courses ce mois" value={String(courseCount)} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 8 }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.inkSoft }}>
          Voir le détail
        </Text>
        <Icon name="chevron-right" size={14} color={colors.inkSoft} strokeWidth={2} />
      </View>
    </Pressable>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 14,
      }}
    >
      <Text
        style={{
          fontSize: 10,
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: 1.2,
          color: colors.inkSoft,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontSize: 18,
          fontWeight: '700',
          color: colors.ink,
          marginTop: 6,
          letterSpacing: -0.3,
        }}
      >
        {value}
      </Text>
    </View>
  );
}
