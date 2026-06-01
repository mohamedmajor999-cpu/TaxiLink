import { Text, View } from 'react-native';

import { useTheme } from '@/lib/theme';

interface Props {
  revenue: number;
  courseCount: number;
}

function formatRevenue(value: number): string {
  return `${Math.round(value).toLocaleString('fr-FR')} €`;
}

export function ProfileStatsTiles({ revenue, courseCount }: Props) {
  return (
    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
      <Tile label="Gains ce mois" value={formatRevenue(revenue)} />
      <Tile label="Courses ce mois" value={String(courseCount)} />
    </View>
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
