import { Linking, Pressable, Text, View } from 'react-native';
import type { ReactNode } from 'react';
import type { Mission } from '@taxilink/supabase-types';
import { computeDisplayFare } from '@taxilink/core';
import { reportError } from '@taxilink/services';

import { Icon, type IconName } from '@/components/icons/Icon';
import { GoogleMapsLogo, WazeLogo } from '@/components/icons/BrandLogos';
import { useGpsPref } from '@/hooks/useGpsPref';
import { useTheme } from '@/lib/theme';

// Sous-composants de l'ecran "Detail course" (app/(driver)/mission/[id].tsx).
// Extraits ici pour respecter le seuil 200 lignes par page (CLAUDE.md).
//
// Tous les sous-composants sont pure-UI sauf ContactNavActions qui consomme
// useGpsPref + Linking. Pas de fetch / pas de state metier.
//
// Les helpers PURS (canSeeFullMission, maskName, formatDuration) vivent dans
// missionDetailHelpers.ts pour rester testables sans dependance RN.

// Re-exports pour preserver les imports existants depuis la page.
export { canSeeFullMission, maskName, formatDuration } from './missionDetailHelpers';
import { formatDuration } from './missionDetailHelpers';

export const URGENT_THRESHOLD_MIN = 10;

// Notice RGPD Article 9 — affichee en haut tant que la course n'est pas acceptee.
// Mention RGPD Art. 9 ajoutee uniquement pour les courses CPAM (donnees de sante).
export function MaskedNotice({ cpam }: { cpam: boolean }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row', alignItems: 'flex-start', gap: 10,
        padding: 12, borderRadius: 14, borderWidth: 1,
        borderColor: colors.border, backgroundColor: colors.surfaceMuted,
      }}
    >
      <View style={{ paddingTop: 1 }}>
        <Icon name="lock" size={16} color={colors.inkMuted} strokeWidth={2} />
      </View>
      <Text style={{ flex: 1, fontSize: 12.5, color: colors.ink, lineHeight: 17 }}>
        <Text style={{ fontWeight: '800' }}>Coordonnées masquées.</Text>
        {' '}Le nom complet, le téléphone et les notes seront visibles uniquement après acceptation de la course
        {cpam ? ' (RGPD Art. 9, données de santé)' : ''}.
      </Text>
    </View>
  );
}

// Bloc actions contact (Appeler / SMS) + navigation (Google Maps / Waze).
// Affiche UNIQUEMENT apres acceptation de la course (cf. canSeeFullMission).
export function ContactNavActions({ mission }: { mission: Mission }) {
  const phone = mission.phone?.replace(/\s/g, '') ?? null;
  const lat = mission.departure_lat;
  const lng = mission.departure_lng;
  const hasCoords = lat != null && lng != null;
  const gpsPref = useGpsPref();

  function open(url: string) {
    // NE PAS taguer l'url complète : tel:/sms: contiennent le n° patient (PII) → fuite RGPD
    // vers Sentry. On ne remonte que le scheme (tel/sms/https) pour le debug. Cf. audit (bonus PII).
    const scheme = url.split(':', 1)[0] || 'unknown';
    Linking.openURL(url).catch((err) => reportError(err, { tags: { phase: 'mission-detail-action', scheme } }));
  }
  function call() { if (phone) open(`tel:${phone}`); }
  function sms() {
    if (!phone) return;
    const firstName = mission.patient_name?.trim().split(/\s+/)[0] ?? null;
    const greeting = firstName ? `Bonjour ${firstName}` : 'Bonjour';
    const body = `${greeting}, je suis en route pour vous chercher. A tout de suite.`;
    open(`sms:${phone}?body=${encodeURIComponent(body)}`);
  }
  function gmaps() {
    if (!hasCoords) return;
    open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`);
  }
  function waze() {
    if (!hasCoords) return;
    open(`https://waze.com/ul?ll=${lat}%2C${lng}&navigate=yes`);
  }

  if (!phone && !hasCoords) return null;

  return (
    <View style={{ gap: 10 }}>
      {hasCoords && gpsPref === 'ask' && (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <BrandActionButton logo={<GoogleMapsLogo size={22} />} label="Google Maps" onPress={gmaps} />
          <BrandActionButton logo={<WazeLogo size={22} />} label="Waze" onPress={waze} />
        </View>
      )}
      {hasCoords && gpsPref === 'maps' && (
        <BrandActionButton logo={<GoogleMapsLogo size={22} />} label="Lancer la navigation" onPress={gmaps} />
      )}
      {hasCoords && gpsPref === 'waze' && (
        <BrandActionButton logo={<WazeLogo size={22} />} label="Lancer la navigation" onPress={waze} />
      )}
      {phone && (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <ActionButton icon="phone" label="Appeler" onPress={call} accent="#10B981" />
          <ActionButton icon="message-square" label="J'arrive" onPress={sms} accent="#0EA5E9" />
        </View>
      )}
    </View>
  );
}

function ActionButton({ icon, label, onPress, accent }: { icon: IconName; label: string; onPress: () => void; accent?: string }) {
  const { colors, isDark } = useTheme();
  return (
    <View style={{ flex: 1, height: 54, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, overflow: 'hidden' }}>
      <Pressable
        onPress={onPress}
        android_ripple={{ color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
      >
        <Icon name={icon} size={18} color={accent ?? colors.ink} strokeWidth={2.2} />
        <Text style={{ fontSize: 14, fontWeight: '800', color: colors.ink, letterSpacing: -0.2 }}>{label}</Text>
      </Pressable>
    </View>
  );
}

function BrandActionButton({ logo, label, onPress }: { logo: ReactNode; label: string; onPress: () => void }) {
  const { colors, isDark } = useTheme();
  return (
    <View style={{ flex: 1, height: 54, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, overflow: 'hidden' }}>
      <Pressable
        onPress={onPress}
        android_ripple={{ color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
      >
        {logo}
        <Text style={{ fontSize: 14, fontWeight: '800', color: colors.ink, letterSpacing: -0.2 }}>{label}</Text>
      </Pressable>
    </View>
  );
}

export function HighlightsGrid({ mission }: { mission: Mission }) {
  const startDate = mission.scheduled_at
    ? new Date(mission.scheduled_at).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })
    : '—';
  const startTime = mission.scheduled_at
    ? new Date(mission.scheduled_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : null;

  const distance = mission.distance_km != null
    ? `${mission.distance_km < 10 ? mission.distance_km.toFixed(1) : Math.round(mission.distance_km)} km`
    : '—';

  const durationMin = mission.duration_min ?? mission.static_duration_min ?? null;
  const duration = durationMin != null
    ? durationMin < 60
      ? `${durationMin} min`
      : `${Math.floor(durationMin / 60)}h ${(durationMin % 60).toString().padStart(2, '0')}`
    : '—';

  const motifMap: Record<string, string> = {
    HDJ: 'HDJ', CONSULTATION: 'Consultation', DIALYSE: 'Dialyse', KINE: 'Kiné', EXAMEN: 'Examen',
  };
  const motif = mission.medical_motif ? motifMap[mission.medical_motif] ?? mission.medical_motif : mission.type === 'CPAM' ? 'Médical' : 'Privé';

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      <HighlightTile icon="calendar" label="Début course" value={startDate} subValue={startTime ?? undefined} />
      <HighlightTile icon="route" label="Distance" value={distance} />
      <HighlightTile icon="clock" label="Durée estimée" value={duration} />
      <HighlightTile icon="stethoscope" label="Motif" value={motif} />
    </View>
  );
}

function HighlightTile({ icon, label, value, subValue }: { icon: 'calendar' | 'route' | 'clock' | 'stethoscope'; label: string; value: string; subValue?: string }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexBasis: '48%', flexGrow: 1, backgroundColor: colors.surface,
        borderRadius: 14, borderWidth: 1.5, borderColor: colors.border,
        paddingHorizontal: 14, paddingVertical: 12, gap: 6,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Icon name={icon} size={14} color={colors.inkSoft} strokeWidth={2} />
        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.inkSoft, letterSpacing: 0.3 }}>
          {label.toUpperCase()}
        </Text>
      </View>
      <Text style={{ fontSize: 17, fontWeight: '900', color: colors.ink, letterSpacing: -0.3 }}>{value}</Text>
      {subValue && (
        <Text style={{ fontSize: 12.5, fontWeight: '700', color: colors.inkMuted, marginTop: -2 }}>{subValue}</Text>
      )}
    </View>
  );
}

export function RouteCard({ mission }: { mission: Mission }) {
  const { colors } = useTheme();
  const fare = computeDisplayFare(mission).value;
  const minutesUntil = mission.scheduled_at
    ? Math.round((new Date(mission.scheduled_at).getTime() - Date.now()) / 60000)
    : Infinity;
  const urgent = minutesUntil <= URGENT_THRESHOLD_MIN;
  const isCpam = mission.type === 'CPAM';
  const typeLabel = isCpam ? 'CPAM' : 'Privé';

  return (
    <View
      style={{
        backgroundColor: colors.surface, borderRadius: 16,
        borderWidth: 1.5, borderColor: colors.border, padding: 18, gap: 12,
      }}
    >
      <View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.ink, marginRight: 12 }} />
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink, flex: 1 }}>{mission.departure}</Text>
        </View>
        <View style={{ width: 2, height: 14, backgroundColor: colors.border, marginLeft: 4, marginVertical: 1 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              width: 12, height: 12, borderRadius: 6,
              backgroundColor: colors.brand, borderWidth: 2, borderColor: colors.ink,
              marginRight: 10, marginLeft: -1,
            }}
          />
          <Text style={{ fontSize: 15, fontWeight: '500', color: colors.inkMuted, flex: 1 }}>{mission.destination}</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
        <View
          style={{
            paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4,
            // Code couleur unifie : CPAM = rouge medical, PRIVE = bleu passager.
            backgroundColor: isCpam ? '#FEE2E2' : '#DBEAFE',
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 0.4, color: isCpam ? '#DC2626' : '#2563EB' }}>
            {typeLabel.toUpperCase()}
          </Text>
        </View>
        <Text style={{ fontSize: 12.5, fontWeight: '700', color: colors.inkMuted }}>
          · {minutesUntil <= 0 ? 'Maintenant' : `Dans ${formatDuration(minutesUntil)}`}
        </Text>
        {mission.return_trip && (
          <Text style={{ fontSize: 12.5, fontWeight: '700', color: colors.inkMuted }}>· A/R</Text>
        )}
        {urgent && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Icon name="zap" size={12} color={colors.danger} />
            <Text style={{ fontSize: 12, fontWeight: '800', color: colors.danger }}>Urgent</Text>
          </View>
        )}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingTop: 4 }}>
        <Text style={{ fontSize: 28, fontWeight: '900', color: colors.ink, letterSpacing: -0.8 }}>
          {fare.toFixed(2).replace('.', ',')} €
        </Text>
        {mission.distance_km != null && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="route" size={14} color={colors.ink} strokeWidth={2.2} />
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.ink }}>
              {mission.distance_km < 10 ? mission.distance_km.toFixed(1) : mission.distance_km.toFixed(0)} km
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

export function DetailsCard({ mission }: { mission: Mission }) {
  const { colors } = useTheme();
  const rows: Array<[string, string | null]> = [
    ['Patient', mission.patient_name ?? null],
    ['Passagers', mission.passengers ? String(mission.passengers) : null],
    ['Type transport', mission.transport_type ?? null],
    ['Motif médical', mission.medical_motif ?? null],
    [
      'Programmée',
      mission.scheduled_at
        ? new Date(mission.scheduled_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
        : null,
    ],
  ].filter(([, v]) => v != null) as Array<[string, string]>;

  if (rows.length === 0) return null;

  return (
    <View
      style={{
        backgroundColor: colors.surface, borderRadius: 16,
        borderWidth: 1.5, borderColor: colors.border, padding: 18,
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: '800', color: colors.inkMuted, marginBottom: 10, letterSpacing: 0.3 }}>
        DÉTAILS
      </Text>
      {rows.map(([label, value], idx) => (
        <View
          key={label}
          style={{
            flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8,
            borderTopWidth: idx === 0 ? 0 : 1, borderTopColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 13.5, color: colors.inkMuted }}>{label}</Text>
          <Text style={{ fontSize: 13.5, fontWeight: '600', color: colors.ink, maxWidth: '60%', textAlign: 'right' }}>
            {value}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function NotesCard({ text, title }: { text: string; title: string }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        backgroundColor: colors.surface, borderRadius: 16,
        borderWidth: 1.5, borderColor: colors.border, padding: 18,
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: '800', color: colors.inkMuted, marginBottom: 8, letterSpacing: 0.3 }}>
        {title.toUpperCase()}
      </Text>
      <Text style={{ fontSize: 14, color: colors.ink, lineHeight: 20 }}>{text}</Text>
    </View>
  );
}

