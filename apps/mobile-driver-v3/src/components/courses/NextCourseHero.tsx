import { Alert, Linking, Pressable, Text, View } from 'react-native';
import type { Mission } from '@taxilink/supabase-types';
import { computeDisplayFare } from '@taxilink/core';

import { Icon } from '@/components/icons/Icon';
import { useTheme } from '@/lib/theme';
import { StepBar } from './StepBar';
import {
  CTA_LABEL,
  STATUS_LABEL,
  formatDuration,
  getMissionProgress,
  shortPlace,
} from './nextCourseHeroHelpers';
import { useNextCourseUrgency, type UrgencyState } from './useNextCourseUrgency';
import { NextCourseUrgencyBanner } from './NextCourseUrgencyBanner';

interface Props {
  mission: Mission;
  onAdvanceStep?: () => void;
  onShowMore?: () => void;
}

// Carte hero PWA-faithful affichant la prochaine course / course en cours.
// Replique apps/web/.../NextCourseHero.tsx + StepBar.tsx, enrichie cote mobile
// d'un systeme d'urgence base sur le GPS (cf. useNextCourseUrgency) : la carte
// vire au vert/orange/rouge selon que le chauffeur est sur place, en retard,
// ou semble avoir oublie la course.
export function NextCourseHero({ mission, onAdvanceStep, onShowMore }: Props) {
  const { colors, isDark } = useTheme();
  const progress = getMissionProgress(mission);
  const urgency = useNextCourseUrgency(mission);

  const minutesUntil = mission.scheduled_at
    ? Math.round((new Date(mission.scheduled_at).getTime() - Date.now()) / 60000)
    : Infinity;
  const time = mission.scheduled_at
    ? new Date(mission.scheduled_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : '—';
  const delay = minutesUntil <= 0 ? 'Maintenant' : `Dans ${formatDuration(minutesUntil)}`;

  const fareInfo = computeDisplayFare(mission);
  const fare = fareInfo.value > 0 ? fareInfo.value.toFixed(0) : '—';
  const isCpam = mission.type === 'CPAM';
  const from = shortPlace(mission.departure);
  const to = shortPlace(mission.destination);

  // Variantes urgentes : couleur de bordure + label statut + label CTA. Le
  // bouton noir reste noir (identite du CTA principal), seule la bordure et
  // le dot changent — le bandeau porte l'info detaillee.
  const urgencyState: UrgencyState = urgency?.state ?? 'normal';
  const borderColor = pickBorder(urgencyState, isDark, colors.border);
  const statusLabel = pickStatusLabel(urgencyState, urgency?.minutesLate ?? 0, STATUS_LABEL[progress]);
  const statusDotColor = pickDotColor(urgencyState, colors.brand);
  const ctaLabel = pickCtaLabel(urgencyState, CTA_LABEL[progress]);

  return (
    <View
      style={{
        borderRadius: 14,
        backgroundColor: colors.surface,
        borderWidth: urgencyState === 'normal' ? 1 : 1.5,
        borderColor,
        padding: 18,
        gap: 0,
      }}
    >
      {/* Statut + badge type */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: statusDotColor }} />
          <Text style={{ fontSize: 10.5, fontWeight: '700', letterSpacing: 0.2, color: colors.inkSoft }}>
            {statusLabel}
          </Text>
        </View>
        <View
          style={{
            paddingHorizontal: 7,
            paddingVertical: 2,
            borderRadius: 999,
            backgroundColor: isCpam ? colors.accentSoft : colors.pillBg,
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 1, color: isCpam ? colors.accent : colors.inkMuted }}>
            {(isCpam ? 'CPAM' : 'Privé').toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Countdown + prix */}
      <View style={{ marginTop: 14, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <Text numberOfLines={1} style={{ fontSize: 18, fontWeight: '800', color: colors.ink, letterSpacing: -0.3, flex: 1 }}>
          {delay}
          <Text style={{ fontWeight: '400', color: colors.inkSoft }}> · {time}</Text>
        </Text>
        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.ink }}>
          {fare}<Text style={{ color: colors.inkSoft }}>€</Text>
        </Text>
      </View>

      {/* Trajet inline */}
      <Text style={{ marginTop: 10, fontSize: 13.5, color: colors.ink, lineHeight: 19 }}>
        <Text style={{ fontWeight: '700' }}>{from}</Text>
        <Text style={{ color: colors.inkSoft }}>{'  →  '}</Text>
        <Text style={{ fontWeight: '700' }}>{to}</Text>
        {(mission.distance_km != null || mission.duration_min != null) && (
          <Text style={{ color: colors.inkSoft, fontSize: 12 }}>
            {' · '}
            {mission.distance_km != null ? `${mission.distance_km} km` : ''}
            {mission.distance_km != null && mission.duration_min != null ? ' · ' : ''}
            {mission.duration_min != null ? `${mission.duration_min} min` : ''}
            {mission.return_trip ? ' · A/R' : ''}
          </Text>
        )}
      </Text>

      {/* Bandeau urgence : visible uniquement si state != normal */}
      {urgency && <NextCourseUrgencyBanner urgency={urgency} patientName={mission.patient_name} />}

      {/* Stepper 4 segments */}
      <View style={{ marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.border }}>
        <StepBar progress={progress} />
      </View>

      {/* Actions : CTA + tel + menu */}
      <View style={{ marginTop: 18, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ flex: 1, height: 38, borderRadius: 10, backgroundColor: isDark ? colors.accent : '#0F0F0F', overflow: 'hidden' }}>
          <Pressable
            onPress={() => {
              if (onAdvanceStep) onAdvanceStep();
              else Alert.alert('Étape suivante', `Prochaine action : ${ctaLabel}`);
            }}
            android_ripple={{ color: 'rgba(255,255,255,0.15)' }}
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 12 }}
          >
            <Text numberOfLines={1} style={{ fontSize: 12.5, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.1 }}>
              {ctaLabel}
            </Text>
            <Text style={{ fontSize: 14, color: '#FFFFFF', fontWeight: '900' }}>→</Text>
          </Pressable>
        </View>
        {mission.phone && (
          <View style={{ width: 38, height: 38, borderRadius: 10, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
            <Pressable
              onPress={() => Linking.openURL(`tel:${mission.phone?.replace(/\s/g, '') ?? ''}`)}
              android_ripple={{ color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
              accessibilityLabel="Appeler le patient"
            >
              <Icon name="phone" size={14} color={colors.inkMuted} strokeWidth={1.8} />
            </Pressable>
          </View>
        )}
        <View style={{ width: 38, height: 38, borderRadius: 10, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
          <Pressable
            onPress={() => {
              if (onShowMore) onShowMore();
              else Alert.alert("Plus d'actions", 'Annuler / Patient absent / Modifier — à venir');
            }}
            android_ripple={{ color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
            accessibilityLabel="Plus d'actions"
          >
            <Text style={{ fontSize: 18, fontWeight: '800', color: colors.inkMuted, lineHeight: 18 }}>···</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// Couleur de bordure de la carte selon l'urgence.
function pickBorder(state: UrgencyState, isDark: boolean, fallback: string): string {
  if (state === 'onsite') return isDark ? 'rgba(34, 197, 94, 0.55)' : '#34D399';
  if (state === 'late_far') return isDark ? 'rgba(249, 115, 22, 0.55)' : '#FB923C';
  if (state === 'forgotten') return isDark ? 'rgba(239, 68, 68, 0.55)' : '#F87171';
  return fallback;
}

function pickDotColor(state: UrgencyState, fallback: string): string {
  if (state === 'onsite') return '#10B981';
  if (state === 'late_far') return '#F97316';
  if (state === 'forgotten') return '#EF4444';
  return fallback;
}

function pickStatusLabel(state: UrgencyState, minutesLate: number, fallback: string): string {
  if (state === 'onsite') return 'TU ES SUR PLACE !';
  if (state === 'late_far') return `EN RETARD DE ${minutesLate} MIN`;
  if (state === 'forgotten') return 'OUBLI ? · RETARD IMPORTANT';
  return fallback;
}

function pickCtaLabel(state: UrgencyState, fallback: string): string {
  if (state === 'onsite') return 'DÉMARRER MAINTENANT';
  if (state === 'late_far') return 'Démarrer + GPS vers client';
  if (state === 'forgotten') return "J'y vais maintenant";
  return fallback;
}
