import { Alert, Linking, Pressable, Text, View } from 'react-native';
import type { Mission } from '@taxilink/supabase-types';
import { computeDisplayFare } from '@taxilink/core';
import { missionMutations, reportError } from '@taxilink/services';

import { Icon } from '@/components/icons/Icon';
import { WhatsAppLogo } from '@/components/icons/BrandLogos';
import { useTheme } from '@/lib/theme';
import { relativeAgo } from './adsHelpers';

interface Props {
  mission: Mission;
  onCancelled?: () => void;
}

// Carte annonce "EN ATTENTE" — fond ambre clair, badge orange.
// Réplique apps/web/.../ads/AdCardWaiting.tsx.
export function AdCardWaiting({ mission, onCancelled }: Props) {
  const { colors, isDark } = useTheme();
  // Carte "EN ATTENTE" :
  // - En LIGHT : palette amber sur fond beige (warning warm). OK.
  // - En DARK : bg neutre (surfaceElevated) + accent amber LOCALISÉ au badge
  //   uniquement. Le tint brun-jaunâtre sur toute la card rend muddy/laid en
  //   dark — on garde la sémantique "pending" via le seul badge.
  const cardBg = isDark ? colors.surfaceElevated : '#FFFBEB';
  const cardBorder = isDark ? 'rgba(255, 200, 100, 0.22)' : '#FDE68A';
  const separatorColor = isDark ? colors.border : '#FDE68A';
  // Badge "EN ATTENTE" : amber soutenu dans les deux modes, c'est lui qui
  // porte tout le signal de statut.
  const amberInk = isDark ? '#FCD34D' : '#92400E';
  const amberBadgeBg = isDark ? 'rgba(252, 211, 77, 0.18)' : '#FDE68A';
  const time = new Date(mission.scheduled_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const isCpam = mission.type === 'CPAM';
  const since = relativeAgo(mission.created_at);
  const fare = computeDisplayFare(mission as never).value;

  function shareWhatsApp() {
    const msg = `Course dispo : ${mission.departure} → ${mission.destination} à ${time}`;
    const url = `whatsapp://send?text=${encodeURIComponent(msg)}`;
    Linking.openURL(url).catch(() =>
      Linking.openURL(`https://wa.me/?text=${encodeURIComponent(msg)}`).catch((err) =>
        reportError(err, { tags: { phase: 'ads-share-whatsapp' } }),
      ),
    );
  }

  function requestCancel() {
    Alert.alert(
      "Annuler l'annonce ?",
      'Elle sera retirée du fil. Tes collègues ne pourront plus la prendre.',
      [
        { text: 'Garder', style: 'cancel' },
        {
          text: 'Annuler',
          style: 'destructive',
          onPress: async () => {
            try {
              // Annonce postee (status AVAILABLE) → DELETE direct via Supabase
              // (policy RLS "Suppression mission auteur" gere l'ownership).
              // NOT `remove` qui passe par l'API route Next.js → cookie SSR
              // absent en RN → "Network request failed".
              // NOT `cancel` qui est reserve aux courses ACCEPTED/IN_PROGRESS.
              await missionMutations.removeOwn(mission.id);
              onCancelled?.();
            } catch (err) {
              reportError(err, { tags: { phase: 'ads-cancel' } });
              Alert.alert(
                'Erreur',
                err instanceof Error ? err.message : "Impossible d'annuler cette annonce.",
              );
            }
          },
        },
      ],
    );
  }

  return (
    <View
      style={{
        borderRadius: 16,
        borderWidth: isDark ? 1.5 : 1,
        borderColor: cardBorder,
        backgroundColor: cardBg,
        paddingHorizontal: 14,
        paddingVertical: 12,
        gap: 6,
      }}
    >
      {/* Header : badge EN ATTENTE + heure + posté il y a */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 10,
            paddingVertical: 3,
            borderRadius: 999,
            backgroundColor: amberBadgeBg,
          }}
        >
          <Icon name="clock" size={11} color={amberInk} strokeWidth={2.4} />
          <Text style={{ fontSize: 10.5, fontWeight: '900', color: amberInk, letterSpacing: 0.4 }}>
            EN ATTENTE
          </Text>
        </View>
        <View style={{ flex: 1 }} />
        <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: '800', color: colors.ink }}>
          {time}
          <Text style={{ color: colors.inkSoft, fontWeight: '500' }}>{since ? ` · postée il y a ${since}` : ''}</Text>
        </Text>
      </View>

      {/* Trajet */}
      <Text style={{ fontSize: 14, fontWeight: '700', color: colors.ink, lineHeight: 19 }}>
        {mission.departure}
        <Text style={{ color: colors.inkSoft, fontWeight: '400' }}>{'  →  '}</Text>
        {mission.destination}
      </Text>

      {/* Prix · type · patient */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <Text style={{ fontSize: 12, color: colors.inkMuted }}>
          <Text style={{ fontWeight: '900', color: colors.ink }}>{fare > 0 ? `${fare.toFixed(0)} €` : '—'}</Text>
          {' · '}
          {isCpam ? 'CPAM' : 'Privé'}
        </Text>
        {mission.patient_name && (
          <Text numberOfLines={1} style={{ fontSize: 12, color: colors.inkMuted, flexShrink: 1 }}>
            {mission.patient_name}
          </Text>
        )}
      </View>

      {/* Footer : Partager (WhatsApp vert) + Annuler (rouge) */}
      <View
        style={{
          marginTop: 6,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: separatorColor,
          borderStyle: 'dashed',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* WhatsApp = couleur identitaire de la marque, garde le vert WhatsApp dans les deux modes. */}
        <View style={{ borderRadius: 10, backgroundColor: '#25D366', overflow: 'hidden' }}>
          <Pressable
            onPress={shareWhatsApp}
            android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 12,
              paddingVertical: 7,
            }}
          >
            <WhatsAppLogo size={13} color="#FFFFFF" />
            <Text style={{ fontSize: 12, fontWeight: '900', color: '#FFFFFF' }}>Partager</Text>
          </Pressable>
        </View>
        <Pressable
          onPress={requestCancel}
          android_ripple={{ color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 4 }}
        >
          <Icon name="x" size={12} color={colors.danger} strokeWidth={2.4} />
          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.danger }}>Annuler l'annonce</Text>
        </Pressable>
      </View>
    </View>
  );
}
