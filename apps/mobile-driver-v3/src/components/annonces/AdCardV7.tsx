import { Alert, Pressable, Text, View } from 'react-native';
import type { Mission } from '@taxilink/supabase-types';
import { computeDisplayFare } from '@taxilink/core';
import { missionMutations, reportError } from '@taxilink/services';

import { Icon } from '@/components/icons/Icon';
import { useTheme } from '@/lib/theme';
import { formatKm } from '@/lib/format';
import { relativeAgo } from '@/components/courses/ads/adsHelpers';

interface Props {
  mission: Mission;
  variant: 'active' | 'taken' | 'expired';
  stuck?: boolean;
  // Optionnel : nom du driver qui a pris la course (variant=taken).
  takenByName?: string | null;
  // Optionnel : libelle resume du scope de partage ("Marseille CPAM 13", "2 personnes").
  shareScope?: string;
  onModify?: (m: Mission) => void;
  onCancelled?: () => void;
  onPress?: () => void;
}

// Carte annonce V7 : style epure avec Modifier + Annuler. Plus de "voir offres"
// car premier arrive premier servi. Stuck banner inline si > 2h sans preneur.
export function AdCardV7({
  mission,
  variant,
  stuck = false,
  takenByName,
  shareScope,
  onModify,
  onCancelled,
  onPress,
}: Props) {
  const { colors, isDark } = useTheme();

  const isCpam = mission.type === 'CPAM';
  const time = new Date(mission.scheduled_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const dateLabel = formatScheduledDate(mission.scheduled_at);
  const fare = computeDisplayFare(mission).value;
  const since = relativeAgo(mission.created_at);
  const urgent =
    variant === 'active' &&
    (new Date(mission.scheduled_at).getTime() - Date.now()) / 60000 <= 60;

  function requestCancel() {
    Alert.alert(
      "Annuler l'annonce ?",
      'Elle sera retiree du fil. Tes collegues ne pourront plus la prendre.',
      [
        { text: 'Garder', style: 'cancel' },
        {
          text: 'Annuler',
          style: 'destructive',
          onPress: async () => {
            try {
              await missionMutations.removeOwn(mission.id);
              onCancelled?.();
            } catch (err) {
              reportError(err, { tags: { phase: 'annonces-cancel' } });
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

  function handleModify() {
    if (onModify) onModify(mission);
    else
      Alert.alert(
        'Modification',
        "Pour ajuster cette annonce, annule-la et reposte-la avec les nouvelles informations.",
      );
  }

  return (
    <View
      style={{
        marginHorizontal: 16,
        marginBottom: 10,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      <Pressable onPress={onPress} disabled={!onPress}>
        {/* Head : tags + posted ago */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            paddingHorizontal: 16,
            paddingTop: 14,
            paddingBottom: 8,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Tag
              label={isCpam ? 'CPAM' : 'PRIVE'}
              bg={isCpam ? colors.accentSoft : colors.surfaceMuted}
              ink={isCpam ? colors.accent : colors.inkSoft}
            />
            {urgent && <Tag label="URGENT" bg={colors.dangerSoft} ink={colors.danger} />}
          </View>
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.inkMuted }}>
            {since ? `postée il y a ${since}` : ''}
          </Text>
        </View>

        {/* Route */}
        <Text
          numberOfLines={1}
          style={{
            paddingHorizontal: 16,
            paddingBottom: 6,
            fontSize: 14.5,
            fontWeight: '900',
            color: colors.ink,
            letterSpacing: -0.2,
          }}
        >
          {mission.departure}
          <Text style={{ color: colors.inkMuted, fontWeight: '700' }}>{'  →  '}</Text>
          {mission.destination}
        </Text>

        {/* Sub-line : date · patient · km · fare */}
        <Text numberOfLines={1} style={{ paddingHorizontal: 16, paddingBottom: 10, fontSize: 12, color: colors.inkSoft }}>
          {dateLabel} · {time}
          {mission.patient_name ? ` · ${mission.patient_name}` : ''}
          {mission.distance_km != null ? ` · ${formatKm(mission.distance_km)} km` : ''}
          {fare > 0 ? ` · ${Math.round(fare)} €` : ''}
        </Text>

        {/* Status chips */}
        <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingBottom: 10 }}>
          {variant === 'active' && !stuck && (
            <StatusChip label="EN ATTENTE" bg={isDark ? 'rgba(34,197,94,0.18)' : '#ECFDF5'} ink={isDark ? '#34D399' : '#065F46'} dot="#16A34A" />
          )}
          {variant === 'active' && stuck && (
            <StatusChip
              label={`AUCUN PRENEUR · ${since.toUpperCase()}`}
              bg={isDark ? 'rgba(239,68,68,0.16)' : '#FEF2F2'}
              ink={isDark ? '#FCA5A5' : '#991B1B'}
            />
          )}
          {variant === 'taken' && (
            <StatusChip
              label={takenByName ? `PRISE PAR ${takenByName.toUpperCase()}` : 'PRISE'}
              bg={isDark ? 'rgba(59,130,246,0.18)' : '#DBEAFE'}
              ink={isDark ? '#93C5FD' : '#1E40AF'}
            />
          )}
          {variant === 'expired' && (
            <StatusChip label="EXPIRÉE" bg={colors.surfaceMuted} ink={colors.inkSoft} />
          )}
          {isFutureDay(mission.scheduled_at) && variant === 'active' && (
            <StatusChip
              label="PROGRAMMÉE"
              bg={isDark ? 'rgba(252,211,77,0.18)' : '#FEF3C7'}
              ink={isDark ? '#FCD34D' : '#92400E'}
            />
          )}
        </View>

        {/* Share scope */}
        {shareScope && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingHorizontal: 16,
              paddingBottom: 12,
              borderTopWidth: 1,
              borderTopColor: colors.borderSoft,
              borderStyle: 'dashed',
              paddingTop: 8,
            }}
          >
            <Icon name="users" size={13} color={colors.inkSoft} strokeWidth={2.2} />
            <Text numberOfLines={1} style={{ fontSize: 11.5, color: colors.inkSoft, flex: 1 }}>
              {shareScope}
            </Text>
          </View>
        )}
      </Pressable>

      {/* Actions (uniquement pour active) */}
      {variant === 'active' && (
        <View
          style={{
            flexDirection: 'row',
            gap: 8,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <View style={{ flex: 1, height: 40, borderRadius: 11, backgroundColor: colors.surfaceMuted, overflow: 'hidden' }}>
            <Pressable
              onPress={handleModify}
              android_ripple={{ color: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <Icon name="pencil" size={13} color={colors.ink} strokeWidth={2.2} />
              <Text style={{ fontSize: 13, fontWeight: '900', color: colors.ink }}>
                {stuck ? 'Ajuster tarif' : 'Modifier'}
              </Text>
            </Pressable>
          </View>
          <View
            style={{
              flex: 1,
              height: 40,
              borderRadius: 11,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(239,68,68,0.45)' : '#FECACA',
              overflow: 'hidden',
            }}
          >
            <Pressable
              onPress={requestCancel}
              android_ripple={{ color: 'rgba(220,38,38,0.12)' }}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <Icon name="x" size={13} color={colors.danger} strokeWidth={2.4} />
              <Text style={{ fontSize: 13, fontWeight: '900', color: colors.danger }}>Annuler</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

function Tag({ label, bg, ink }: { label: string; bg: string; ink: string }) {
  return (
    <View style={{ paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5, backgroundColor: bg }}>
      <Text style={{ fontSize: 10, fontWeight: '900', color: ink, letterSpacing: 0.4 }}>{label}</Text>
    </View>
  );
}

function StatusChip({ label, bg, ink, dot }: { label: string; bg: string; ink: string; dot?: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 5,
        backgroundColor: bg,
      }}
    >
      {dot && <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: dot }} />}
      <Text style={{ fontSize: 10.5, fontWeight: '900', color: ink, letterSpacing: 0.3 }}>
        {label}
      </Text>
    </View>
  );
}

function formatScheduledDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / 86_400_000);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return 'Demain';
  if (diff === -1) return 'Hier';
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' });
}

function isFutureDay(iso: string): boolean {
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return d.getTime() > t.getTime();
}
