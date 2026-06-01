import { Pressable, Text, View } from 'react-native';
import type { MedicalMotif } from '@taxilink/core';

import { Icon } from '@/components/icons/Icon';
import { useTheme } from '@/lib/theme';
import { Stepper } from './PosterFormPrimitives';

interface Props {
  medicalMotif: MedicalMotif | null;
  setMedicalMotif: (m: MedicalMotif) => void;
  returnTrip: boolean;
  setReturnTrip: (v: boolean) => void;
  tpmr: boolean;
  setTpmr: (v: boolean) => void;
  passengers: number;
  setPassengers: (n: number) => void;
}

export function PosterCpamBlock({
  medicalMotif, setMedicalMotif,
  returnTrip, setReturnTrip,
  tpmr, setTpmr,
  passengers, setPassengers,
}: Props) {
  const { colors, isDark } = useTheme();
  const tpmrBg = tpmr ? (isDark ? colors.accent : '#0F0F0F') : colors.surface;
  const tpmrBorder = tpmr ? (isDark ? colors.accent : '#0F0F0F') : colors.inkSoft;

  return (
    <View
      style={{
        marginTop: 18,
        backgroundColor: colors.surfaceMuted,
        borderLeftWidth: 3,
        borderLeftColor: colors.brand,
        borderRadius: 14,
        padding: 16,
        gap: 14,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ backgroundColor: isDark ? colors.accent : '#0F0F0F', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 }}>
          <Text style={{ color: colors.brand, fontSize: 11, fontWeight: '800', letterSpacing: 0.4 }}>CPAM</Text>
        </View>
        <Text style={{ fontSize: 14, fontWeight: '800', color: colors.ink, flex: 1 }}>
          Indispensables au tarif conventionné
        </Text>
      </View>

      <View>
        <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 0.5, color: colors.inkSoft, textTransform: 'uppercase', marginBottom: 8 }}>
          Motif
        </Text>
        <SegmentedPair
          leftActive={medicalMotif === 'HDJ'}
          rightActive={medicalMotif === 'CONSULTATION'}
          leftLabel="HDJ"
          rightLabel="Consultation"
          onLeft={() => setMedicalMotif('HDJ')}
          onRight={() => setMedicalMotif('CONSULTATION')}
        />
      </View>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 0.5, color: colors.inkSoft, textTransform: 'uppercase', marginBottom: 8 }}>
            Aller-retour
          </Text>
          <SegmentedPair
            leftActive={!returnTrip}
            rightActive={returnTrip}
            leftLabel="Non"
            rightLabel="Oui"
            onLeft={() => setReturnTrip(false)}
            onRight={() => setReturnTrip(true)}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 0.5, color: colors.inkSoft, textTransform: 'uppercase', marginBottom: 8 }}>
            Patients
          </Text>
          <Stepper value={passengers} onChange={setPassengers} min={1} max={4} />
        </View>
      </View>

      <Pressable
        onPress={() => setTpmr(!tpmr)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }}
      >
        <View
          style={{
            width: 22, height: 22, borderRadius: 6, borderWidth: 2,
            borderColor: tpmrBorder,
            backgroundColor: tpmrBg,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          {tpmr && <Icon name="check" size={14} color="#FFFFFF" strokeWidth={3} />}
        </View>
        <Text style={{ fontSize: 13.5, fontWeight: '600', color: colors.ink, flex: 1 }}>
          Patient en fauteuil roulant <Text style={{ fontWeight: '800' }}>+30 € forfait</Text>
        </Text>
      </Pressable>
    </View>
  );
}

function SegmentedPair({
  leftActive, rightActive, leftLabel, rightLabel, onLeft, onRight,
}: {
  leftActive: boolean; rightActive: boolean;
  leftLabel: string; rightLabel: string;
  onLeft: () => void; onRight: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 3,
        height: 44,
      }}
    >
      <SegmentBtn label={leftLabel} active={leftActive} onPress={onLeft} />
      <SegmentBtn label={rightLabel} active={rightActive} onPress={onRight} />
    </View>
  );
}

function SegmentBtn({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors, isDark } = useTheme();
  const activeBg = isDark ? colors.accent : '#0F0F0F';
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        height: 36,
        borderRadius: 999,
        backgroundColor: active ? activeBg : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: 13.5, fontWeight: '700', color: active ? colors.brand : colors.inkSoft }}>
        {label}
      </Text>
    </Pressable>
  );
}
