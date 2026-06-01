import { Text, View } from 'react-native';

import { useTheme } from '@/lib/theme';

interface Props {
  total: number;
  count: number;
  avgPerRide: number;
  cpamRatioPct: number;
}

// 4 tuiles KPI : Revenus / Courses / € par course / Ratio CPAM.
// Layout 2x2 grid via flexWrap (pas de Grid natif RN).
// Réplique apps/web/.../HistoryKpiTiles.tsx.
export function HistoryKpiTiles({ total, count, avgPerRide, cpamRatioPct }: Props) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      <Tile k="Revenus" v={`${Math.round(total).toLocaleString('fr-FR')}`} unit="€" />
      <Tile k="Courses" v={`${count}`} />
      <Tile k="€ / course" v={`${avgPerRide.toFixed(1).replace('.', ',')}`} unit="€" />
      <Tile k="Ratio CPAM" v={`${cpamRatioPct}`} unit="%" />
    </View>
  );
}

function Tile({ k, v, unit }: { k: string; v: string; unit?: string }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexBasis: '48%',
        flexGrow: 1,
        backgroundColor: colors.surface,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: colors.border,
        paddingHorizontal: 14,
        paddingVertical: 14,
      }}
    >
      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.inkSoft, letterSpacing: 0.3 }}>
        {k.toUpperCase()}
      </Text>
      <View style={{ marginTop: 4, flexDirection: 'row', alignItems: 'baseline' }}>
        <Text style={{ fontSize: 22, fontWeight: '900', color: colors.ink, letterSpacing: -0.5 }}>
          {v}
        </Text>
        {unit && (
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.inkSoft, marginLeft: 2 }}>
            {unit}
          </Text>
        )}
      </View>
    </View>
  );
}
