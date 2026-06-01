import { useEffect } from 'react';
import { Modal, Text, Vibration, View } from 'react-native';
import { router } from 'expo-router';

import { Icon } from '@/components/icons/Icon';
import { useIncomingMissionOffer } from '@/hooks/useIncomingMissionOffer';
import { useTheme } from '@/lib/theme';
import {
  CountdownBar,
  NotifHead,
  PatientRow,
  PriceRow,
  PrimaryAcceptButton,
  SecondaryButton,
  TagsRow,
  TripBlock,
} from './IncomingMissionOfferModal.parts';

// Modal V7 "Nouvelle mission" : fond clair, card en haut, gros prix, tags
// discrets, trip dots, patient mini-card, actions Refuser/Detail + CTA
// Accepter XL avec countdown. Remplace l'ancien design "header noir + jaune"
// trop agressif (cf. brief V7 : "moins de jaune, plus epure").
//
// Tous les sous-composants pure-UI sont dans IncomingMissionOfferModal.parts.tsx
// pour garder ce fichier sous 150 lignes.
export function IncomingMissionOfferModal() {
  const { state, loading, error, accept, refuse, dismiss } = useIncomingMissionOffer();
  const { colors, isDark } = useTheme();

  // OFF-02 : vibration INSISTANTE et repetee tant que l'offre est affichee. Une
  // offre exclusive (~20s) ne doit jamais passer inapercue, telephone pose. Le
  // pattern boucle (2e arg = true) et est coupe a l'accept/refuse/expire via le
  // cleanup (changement d'offre ou disparition du state).
  useEffect(() => {
    if (!state) return;
    Vibration.vibrate([0, 500, 250, 500, 250, 700, 1200], true);
    return () => Vibration.cancel();
  }, [state?.offer.id]);

  if (!state) return null;
  const { offer, mission, secondsLeft } = state;

  function handleShowDetails() {
    dismiss();
    router.push(`/mission/${mission.id}`);
  }

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={() => void refuse()}
      statusBarTranslucent
    >
      <View
        style={{
          flex: 1,
          backgroundColor: isDark ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.28)',
          paddingTop: 60,
          paddingHorizontal: 14,
        }}
      >
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 24,
            padding: 20,
            // Cap la largeur a 480px : sur foldable Android ouvert ou paysage
            // accidentel, la card resterait raisonnable au lieu de s'etirer
            // en bandeau geant.
            maxWidth: 480,
            width: '100%',
            alignSelf: 'center',
            shadowColor: '#000',
            shadowOpacity: isDark ? 0.5 : 0.25,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: 12 },
            elevation: 24,
            borderWidth: isDark ? 1 : 0,
            borderColor: colors.border,
          }}
        >
          <NotifHead onClose={dismiss} colors={colors} />
          <PriceRow mission={mission} offerDistance={offer.distance_km_at_offer} colors={colors} />
          <TagsRow mission={mission} colors={colors} isDark={isDark} />
          <TripBlock mission={mission} colors={colors} />
          <PatientRow mission={mission} colors={colors} isDark={isDark} />

          {error && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <Icon name="info" size={13} color={colors.danger} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.danger }}>{error}</Text>
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
            <SecondaryButton icon="x" label="Refuser" onPress={refuse} disabled={loading} colors={colors} isDark={isDark} />
            <SecondaryButton icon="info" label="Détails" onPress={handleShowDetails} disabled={loading} colors={colors} isDark={isDark} />
          </View>

          <PrimaryAcceptButton onPress={accept} loading={loading} secondsLeft={secondsLeft} colors={colors} isDark={isDark} />

          <CountdownBar sentAt={offer.sent_at} expiresAt={offer.expires_at} secondsLeft={secondsLeft} colors={colors} />
        </View>
      </View>
    </Modal>
  );
}
