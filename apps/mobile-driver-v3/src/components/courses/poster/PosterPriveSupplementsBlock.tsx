import { Text, View } from 'react-native';

import { useTheme } from '@/lib/theme';
import { Stepper } from './PosterFormPrimitives';

interface Props {
  passengers: number;
  setPassengers: (n: number) => void;
  extraBagages: number;
  setExtraBagages: (n: number) => void;
  extraEncombrants: number;
  setExtraEncombrants: (n: number) => void;
}

export function PosterPriveSupplementsBlock({
  passengers, setPassengers,
  extraBagages, setExtraBagages,
  extraEncombrants, setExtraEncombrants,
}: Props) {
  const { colors } = useTheme();
  return (
    <View style={{ marginTop: 22 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <Text style={{ fontSize: 18, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 }}>
          Suppléments
        </Text>
        <Text style={{ fontSize: 11.5, fontWeight: '700', color: colors.inkSoft }}>
          Facultatif — arrêté préfectoral
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <SupplementCol label="Passagers" hint="5e et + : 4 €/pers.">
          <Stepper value={passengers} onChange={setPassengers} min={1} max={8} />
        </SupplementCol>
        <SupplementCol label="Bagages 4e +" hint="2 € / bagage">
          <Stepper value={extraBagages} onChange={setExtraBagages} min={0} max={10} />
        </SupplementCol>
        <SupplementCol label="Encombrants" hint="2 € / pièce">
          <Stepper value={extraEncombrants} onChange={setExtraEncombrants} min={0} max={10} />
        </SupplementCol>
      </View>
    </View>
  );
}

function SupplementCol({
  label, hint, children,
}: { label: string; hint: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 10.5, fontWeight: '800', letterSpacing: 0.5, color: colors.inkSoft, textTransform: 'uppercase', marginBottom: 6 }}>
        {label}
      </Text>
      {children}
      <Text style={{ fontSize: 11, color: colors.inkSoft, marginTop: 4 }} numberOfLines={1}>
        {hint}
      </Text>
    </View>
  );
}
