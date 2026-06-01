import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { Icon } from '@/components/icons/Icon';
import { useTheme } from '@/lib/theme';
import { AddressAutocompleteField } from './AddressAutocompleteField';
import { DateFrInput, TimeFrInput } from './DateTimeFrInput';
import { FieldInput, FieldLabel, FieldRow, WhenPill } from './PosterFormPrimitives';
import { PosterMicCta } from './PosterMicCta';
import { PosterCpamBlock } from './PosterCpamBlock';
import { PosterPriveSupplementsBlock } from './PosterPriveSupplementsBlock';
import type { PosterCourseState } from './usePosterCourse';

interface Props {
  c: PosterCourseState;
}

export function PosterCourseForm({ c }: Props) {
  const { colors } = useTheme();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 32 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={{ marginBottom: 18, flexDirection: 'row', alignItems: 'flex-end' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, fontWeight: '800', letterSpacing: 0.8, color: colors.inkSoft, textTransform: 'uppercase', marginBottom: 8 }}>
            ÉTAPE 2/2
          </Text>
          <Text style={{ fontSize: 34, fontWeight: '800', color: colors.ink, letterSpacing: -0.8, lineHeight: 36 }}>
            Nouvelle
          </Text>
          <Text style={{ fontSize: 34, fontWeight: '800', color: colors.inkSoft, letterSpacing: -0.8, lineHeight: 36 }}>
            course
          </Text>
        </View>
        {c.hasAnyContent && (
          <ResetButton onPress={c.resetForm} />
        )}
      </View>

      <PosterMicCta voice={c.voice} />

      <View style={{ marginTop: 4 }}>
        <AddressAutocompleteField
          label="Départ"
          placeholder="Adresse de prise en charge"
          value={c.departure}
          onChangeText={c.setDeparture}
          onSelectSuggestion={c.onSelectDeparture}
          leading={<View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.ink }} />}
          trailing={<FieldMicButton voice={c.departureVoice} />}
        />
        <AddressAutocompleteField
          label="Arrivée"
          placeholder="Adresse de dépose"
          value={c.destination}
          onChangeText={c.setDestination}
          onSelectSuggestion={c.onSelectDestination}
          leading={<View style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: colors.brand }} />}
          trailing={<FieldMicButton voice={c.destinationVoice} />}
        />

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <View style={{ width: 24, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="clock" size={19} color={colors.inkSoft} />
          </View>
          <FieldLabel>Quand</FieldLabel>
          <View style={{ flexDirection: 'row', gap: 8, marginLeft: 'auto' }}>
            <WhenPill
              active={c.when === 'now'}
              onPress={c.setWhenNow}
              label="Maintenant"
              icon={<Icon name="zap" size={14} color={c.when === 'now' ? colors.brandInk : colors.ink} />}
            />
            <WhenPill
              active={c.when === 'later'}
              onPress={c.setWhenLater}
              label="Plus tard"
              icon={<Icon name="calendar" size={14} color={c.when === 'later' ? colors.brandInk : colors.ink} />}
            />
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 12, paddingTop: 14, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <View style={{ flex: 1.3 }}>
            <DateFrInput value={c.date} onChange={c.onChangeDate} />
          </View>
          <View style={{ flex: 1 }}>
            <TimeFrInput value={c.time} onChange={c.onChangeTime} />
          </View>
        </View>

        <FieldRow leading={<Icon name="user" size={19} color={colors.inkSoft} />}>
          <FieldLabel>Client</FieldLabel>
          <FieldInput
            value={c.patientName}
            onChangeText={(v) => c.setPatientName(v.replace(/\d+/g, ''))}
            placeholder="Nom du client"
            autoCapitalize="words"
          />
          {c.type === 'CPAM' && !c.patientName.trim() && (
            <Text style={{ marginTop: 4, fontSize: 11.5, fontWeight: '600', color: colors.inkSoft }}>
              Obligatoire pour CPAM
            </Text>
          )}
        </FieldRow>

        <FieldRow leading={<Icon name="phone" size={19} color={colors.inkSoft} />}>
          <FieldLabel>Téléphone</FieldLabel>
          <FieldInput
            value={c.phone}
            onChangeText={c.setPhone}
            placeholder="Pour le contacter à l'arrivée"
            keyboardType="phone-pad"
          />
        </FieldRow>
      </View>

      {c.type === 'CPAM' && (
        <PosterCpamBlock
          medicalMotif={c.medicalMotif}
          setMedicalMotif={c.setMedicalMotif}
          returnTrip={c.returnTrip}
          setReturnTrip={c.setReturnTrip}
          tpmr={c.tpmr}
          setTpmr={c.setTpmr}
          passengers={c.passengers}
          setPassengers={c.setPassengers}
        />
      )}

      {c.type === 'PRIVE' && (
        <PosterPriveSupplementsBlock
          passengers={c.passengers}
          setPassengers={c.setPassengers}
          extraBagages={c.extraBagages}
          setExtraBagages={c.setExtraBagages}
          extraEncombrants={c.extraEncombrants}
          setExtraEncombrants={c.setExtraEncombrants}
        />
      )}

      <View style={{ marginTop: 22 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 }}>
            Remarques
          </Text>
          <Text style={{ fontSize: 11.5, fontWeight: '700', color: colors.inkSoft }}>Facultatif</Text>
        </View>
        <View style={{ backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, minHeight: 90 }}>
          <FieldInput
            value={c.notes}
            onChangeText={c.setNotes}
            placeholder="Étage, code, particularité du client, instructions pour le chauffeur…"
            multiline
            numberOfLines={3}
          />
        </View>
      </View>
    </ScrollView>
  );
}

function ResetButton({ onPress }: { onPress: () => void }) {
  const { colors, isDark } = useTheme();
  // Confirmation avant de vider — on évite la frustration d'un tap accidentel
  // qui efface une dictée vocale qu'on vient de finir.
  const handlePress = () => {
    Alert.alert(
      'Tout effacer ?',
      'Tous les champs (adresses, client, prix, remarques…) seront vidés.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Effacer', style: 'destructive', onPress },
      ],
    );
  };
  return (
    <View style={{ height: 36, borderRadius: 18, overflow: 'hidden', backgroundColor: colors.surfaceMuted }}>
      <Pressable
        onPress={handlePress}
        accessibilityLabel="Tout effacer le formulaire"
        android_ripple={{ color: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)' }}
        style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 36, gap: 6 }}
      >
        <Icon name="trash" size={14} color={colors.inkSoft} strokeWidth={2.2} />
        <Text style={{ fontSize: 12.5, fontWeight: '700', color: colors.inkSoft }}>Tout effacer</Text>
      </Pressable>
    </View>
  );
}

function FieldMicButton({
  voice,
}: {
  voice: { isListening: boolean; isProcessing: boolean; toggle: () => void };
}) {
  const { colors, isDark } = useTheme();
  const { isListening, isProcessing, toggle } = voice;
  const listeningBg = isDark ? colors.accent : '#0F0F0F';
  const bg = isListening ? listeningBg : isProcessing ? colors.brand : colors.surfaceMuted;
  return (
    <View style={{ width: 38, height: 38, borderRadius: 19, overflow: 'hidden', backgroundColor: bg }}>
      <Pressable
        onPress={isProcessing ? undefined : toggle}
        accessibilityLabel="Dicter uniquement cette adresse"
        android_ripple={{ color: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)' }}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
      >
        {isProcessing ? (
          <ActivityIndicator size="small" color={colors.brandInk} />
        ) : (
          // En dark, bg listening = colors.accent (bleu) ET colors.brand = aussi bleu
          // → mic invisible. On force brandInk (blanc) en dark mode.
          <Icon name="mic" size={17} color={isListening ? (isDark ? colors.brandInk : colors.brand) : colors.inkSoft} strokeWidth={2.2} />
        )}
      </Pressable>
    </View>
  );
}
