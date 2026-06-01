import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Animated, Linking, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import type { Mission } from '@taxilink/supabase-types';
import { computeDisplayFare } from '@taxilink/core';
import { missionMutations, missionProgressMutations, missionQueries, reportError } from '@taxilink/services';

import { Icon, type IconName } from '@/components/icons/Icon';
import { GoogleMapsLogo, WazeLogo } from '@/components/icons/BrandLogos';
import { useAuth } from '@/hooks/useAuth';
import { useGpsPref } from '@/hooks/useGpsPref';
import { useHoldAccept } from '@/hooks/useHoldAccept';
import { useTheme } from '@/lib/theme';
import { triggerPushNotifyMissionAccepted } from '@/lib/pushNotifyTrigger';

// === Masquage RGPD Article 9 (réplique apps/web/src/lib/missionMask.ts) ===
// Tant que la course n'est pas acceptée, ou que le viewer n'est ni l'auteur ni
// l'accepteur ni le client, on masque : nom (initiales), téléphone (null), notes (null).
function canSeeFullMission(mission: Mission, viewerId: string | null): boolean {
  if (!viewerId) return false;
  if (mission.status === 'AVAILABLE') return false;
  return (
    mission.shared_by === viewerId ||
    mission.driver_id === viewerId ||
    mission.client_id === viewerId
  );
}
function maskName(fullName: string | null): string | null {
  if (!fullName) return null;
  return (
    fullName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + '.')
      .join(' ') || null
  );
}

const URGENT_THRESHOLD_MIN = 10;

export default function MissionDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const [rawMission, setRawMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  // Applique le masquage RGPD si la course n'est pas acceptée par le viewer
  const isMasked = rawMission ? !canSeeFullMission(rawMission, user?.id ?? null) : false;
  const mission: Mission | null = rawMission
    ? isMasked
      ? { ...rawMission, patient_name: maskName(rawMission.patient_name), phone: null, notes: null }
      : rawMission
    : null;

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    // RGPD (audit H-01) : detail via le RPC masque get_mission_detail. La PII
    // patient n'est renvoyee que si le viewer est proprietaire/chauffeur assigne/
    // auteur ; pour une course AVAILABLE non possedee, elle est masquee cote serveur.
    // Le masquage client ci-dessous (isMasked) reste en filet defense-en-profondeur.
    missionQueries
      .getByIdMasked(id)
      .then((m) => {
        if (!cancelled) setRawMission(m);
      })
      .catch((err) => reportError(err, { tags: { phase: 'mission-detail-fetch' } }))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleConfirmAccept() {
    if (!mission || !user?.id) return;
    setAccepting(true);
    try {
      await missionMutations.accept(mission.id, user.id);
      // Push notif au poster (shared_by) : "<driver> a pris ta course".
      // Fire-and-forget, ne bloque pas le retour utilisateur.
      triggerPushNotifyMissionAccepted(mission.id);
      Alert.alert('Course acceptée', 'Tu as accepté cette course.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      reportError(err, { tags: { phase: 'mission-accept' } });
      Alert.alert('Erreur', "Impossible d'accepter cette course. Elle a peut-être déjà été prise.");
      setAccepting(false);
    }
  }

  const hold = useHoldAccept({ onConfirm: handleConfirmAccept, duration: 1250, disabled: accepting });
  const holdLabel =
    hold.state === 'confirmed' ? 'Course acceptée' : hold.state === 'pressing' ? 'Maintenez…' : 'Maintenir pour accepter';
  const fillWidth = hold.progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.bg,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Retour"
          style={{
            width: 40, height: 40, borderRadius: 20,
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: colors.surfaceMuted,
          }}
        >
          <Icon name="x" size={20} color={colors.ink} strokeWidth={2} />
        </Pressable>
        <Text style={{ flex: 1, fontSize: 17, fontWeight: '800', color: colors.ink }}>Détail de la course</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : !mission ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.ink, marginBottom: 8 }}>Course introuvable</Text>
          <Text style={{ fontSize: 14, color: colors.inkSoft, textAlign: 'center' }}>
            Elle a peut-être été supprimée ou déjà attribuée.
          </Text>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
            {isMasked && <MaskedNotice cpam={mission.type === 'CPAM'} />}
            <HighlightsGrid mission={mission} />
            <RouteCard mission={mission} />
            {/* Bloc contact + navigation : visible UNIQUEMENT après acceptation (RGPD) */}
            {!isMasked && <ContactNavActions mission={mission} />}
            <DetailsCard mission={mission} />
            {mission.notes && <NotesCard text={mission.notes} title="Notes" />}
          </ScrollView>

          {/* Footer "Je démarre / Reprendre" : course deja acceptee (IN_PROGRESS),
              pas encore terminee. Bascule vers l'ecran active plein ecran. */}
          {mission.status === 'IN_PROGRESS' && (
            <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bg }}>
              <View style={{ height: 56, borderRadius: 12, backgroundColor: isDark ? colors.accent : '#0F0F0F', overflow: 'hidden' }}>
                <Pressable
                  onPress={async () => {
                    try {
                      if (!mission.enroute_at) {
                        await missionProgressMutations.markEnRoute(mission.id);
                      }
                      router.push(`/mission/${mission.id}/active`);
                    } catch (err) {
                      reportError(err, { tags: { phase: 'mission-detail-start' } });
                      Alert.alert('Erreur', err instanceof Error ? err.message : 'Réessaie dans un instant.');
                    }
                  }}
                  android_ripple={{ color: 'rgba(255,255,255,0.15)' }}
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <Icon name="zap" size={16} color="#FFFFFF" strokeWidth={2.4} />
                  <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '900', letterSpacing: -0.2 }}>
                    {mission.enroute_at ? 'Reprendre la course' : 'Je démarre la course'}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Footer hold-to-accept : caché si déjà accepté/en cours/terminée */}
          {mission.status === 'AVAILABLE' && (
          <View
            style={{
              padding: 16,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              backgroundColor: colors.bg,
            }}
          >
            <View style={{ height: 56, borderRadius: 12, overflow: 'hidden' }}>
              <View
                style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  borderRadius: 12,
                  backgroundColor: isDark ? colors.accent : '#0F0F0F',
                }}
              />
              <Animated.View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: 0, left: 0, bottom: 0,
                  width: fillWidth,
                  backgroundColor: colors.brand,
                  opacity: 0.45,
                }}
              />
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {accepting ? (
                  <ActivityIndicator color={colors.brand} />
                ) : (
                  <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: -0.2 }}>
                    {holdLabel}
                  </Text>
                )}
              </View>
              <Pressable
                onPressIn={hold.start}
                onPressOut={hold.cancel}
                disabled={accepting}
                accessibilityRole="button"
                accessibilityLabel="Maintenir pour accepter la course"
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 12 }}
              />
            </View>
          </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

// Notice RGPD Article 9 — affichée en haut tant que la course n'est pas acceptée.
// Mention RGPD Art. 9 ajoutée uniquement pour les courses CPAM (données de santé).
function MaskedNotice({ cpam }: { cpam: boolean }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        padding: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surfaceMuted,
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
// Affiché UNIQUEMENT après acceptation de la course (cf. canSeeFullMission).
// Deep links via Linking.openURL — Waze et Google Maps gérés via leurs URL universels
// qui s'ouvrent dans l'app si installée, sinon dans le navigateur.
function ContactNavActions({ mission }: { mission: Mission }) {
  const phone = mission.phone?.replace(/\s/g, '') ?? null;
  const lat = mission.departure_lat;
  const lng = mission.departure_lng;
  const hasCoords = lat != null && lng != null;
  const gpsPref = useGpsPref();

  function open(url: string) {
    Linking.openURL(url).catch((err) =>
      reportError(err, { tags: { phase: 'mission-detail-action', url } }),
    );
  }
  function call() { if (phone) open(`tel:${phone}`); }
  // SMS pre-rempli "j'arrive" : ouvre l'app SMS native avec le message preset
  // (iOS et Android supportent tous les deux le param ?body=). Le chauffeur
  // n'a qu'a tapper "Envoyer". Personnalise avec le prenom du patient si dispo.
  function sms() {
    if (!phone) return;
    const firstName = mission.patient_name?.trim().split(/\s+/)[0] ?? null;
    const greeting = firstName ? `Bonjour ${firstName}` : 'Bonjour';
    const body = `${greeting}, je suis en route pour vous chercher. A tout de suite.`;
    // Format URL universel : iOS prefere `&body=`, Android `?body=`.
    // `?body=` fonctionne sur les 2 (testé iOS 14+, Android 8+).
    open(`sms:${phone}?body=${encodeURIComponent(body)}`);
  }
  function gmaps() {
    if (!hasCoords) return;
    // URL universelle Google Maps Directions API — ouvre l'app sur iOS/Android si installée
    open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`);
  }
  function waze() {
    if (!hasCoords) return;
    open(`https://waze.com/ul?ll=${lat}%2C${lng}&navigate=yes`);
  }

  if (!phone && !hasCoords) return null;

  return (
    <View style={{ gap: 10 }}>
      {/* Navigation : pref 'ask' = 2 boutons (defaut), sinon bouton unique
          vers l'app preferee. Le chauffeur choisit dans Profil > Application GPS. */}
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
      {/* Contact : Appeler (1-tap → tel:) + J'arrive (1-tap → SMS pre-rempli) */}
      {phone && (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <ActionButton icon="phone" label="Appeler" onPress={call} accent="#10B981" />
          <ActionButton icon="message-square" label="J'arrive" onPress={sms} accent="#0EA5E9" />
        </View>
      )}
    </View>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
  accent,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  accent?: string;
}) {
  const { colors, isDark } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        height: 54,
        borderRadius: 14,
        backgroundColor: colors.surface,
        borderWidth: 1.5,
        borderColor: colors.border,
        overflow: 'hidden',
      }}
    >
      <Pressable
        onPress={onPress}
        android_ripple={{ color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <Icon name={icon} size={18} color={accent ?? colors.ink} strokeWidth={2.2} />
        <Text style={{ fontSize: 14, fontWeight: '800', color: colors.ink, letterSpacing: -0.2 }}>
          {label}
        </Text>
      </Pressable>
    </View>
  );
}

// Variante pour logos brand (Google Maps / Waze) : prend un node React
// au lieu d'un nom d'icône Lucide. Fond surface + bordure du theme.
function BrandActionButton({
  logo,
  label,
  onPress,
}: {
  logo: ReactNode;
  label: string;
  onPress: () => void;
}) {
  const { colors, isDark } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        height: 54,
        borderRadius: 14,
        backgroundColor: colors.surface,
        borderWidth: 1.5,
        borderColor: colors.border,
        overflow: 'hidden',
      }}
    >
      <Pressable
        onPress={onPress}
        android_ripple={{ color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        {logo}
        <Text style={{ fontSize: 14, fontWeight: '800', color: colors.ink, letterSpacing: -0.2 }}>
          {label}
        </Text>
      </Pressable>
    </View>
  );
}

// 4 tuiles bien visibles : date début, distance, durée estimée, motif.
// Layout 2x2 grid via flexWrap (pas de Grid natif RN).
function HighlightsGrid({ mission }: { mission: Mission }) {
  const startDate = mission.scheduled_at
    ? new Date(mission.scheduled_at).toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
      })
    : '—';
  const startTime = mission.scheduled_at
    ? new Date(mission.scheduled_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : null;

  const distance = mission.distance_km != null
    ? `${mission.distance_km < 10 ? mission.distance_km.toFixed(1) : Math.round(mission.distance_km)} km`
    : '—';

  // duration_min (réel temps de trajet) ou static_duration_min (sans trafic) en fallback
  const durationMin = mission.duration_min ?? mission.static_duration_min ?? null;
  const duration = durationMin != null
    ? durationMin < 60
      ? `${durationMin} min`
      : `${Math.floor(durationMin / 60)}h ${(durationMin % 60).toString().padStart(2, '0')}`
    : '—';

  const motifMap: Record<string, string> = {
    HDJ: 'HDJ',
    CONSULTATION: 'Consultation',
    DIALYSE: 'Dialyse',
    KINE: 'Kiné',
    EXAMEN: 'Examen',
  };
  const motif = mission.medical_motif ? motifMap[mission.medical_motif] ?? mission.medical_motif : mission.type === 'CPAM' ? 'Médical' : 'Privé';

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      <HighlightTile
        icon="calendar"
        label="Début course"
        value={startDate}
        subValue={startTime ?? undefined}
      />
      <HighlightTile icon="route" label="Distance" value={distance} />
      <HighlightTile icon="clock" label="Durée estimée" value={duration} />
      <HighlightTile icon="stethoscope" label="Motif" value={motif} />
    </View>
  );
}

function HighlightTile({
  icon,
  label,
  value,
  subValue,
}: {
  icon: 'calendar' | 'route' | 'clock' | 'stethoscope';
  label: string;
  value: string;
  subValue?: string;
}) {
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
        paddingVertical: 12,
        gap: 6,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Icon name={icon} size={14} color={colors.inkSoft} strokeWidth={2} />
        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.inkSoft, letterSpacing: 0.3 }}>
          {label.toUpperCase()}
        </Text>
      </View>
      <Text style={{ fontSize: 17, fontWeight: '900', color: colors.ink, letterSpacing: -0.3 }}>
        {value}
      </Text>
      {subValue && (
        <Text style={{ fontSize: 12.5, fontWeight: '700', color: colors.inkMuted, marginTop: -2 }}>
          {subValue}
        </Text>
      )}
    </View>
  );
}

function RouteCard({ mission }: { mission: Mission }) {
  const { colors } = useTheme();
  const fare = computeDisplayFare(mission as never).value;
  const minutesUntil = mission.scheduled_at
    ? Math.round((new Date(mission.scheduled_at).getTime() - Date.now()) / 60000)
    : Infinity;
  const urgent = minutesUntil <= URGENT_THRESHOLD_MIN;
  const isCpam = mission.type === 'CPAM';
  const typeLabel = isCpam ? 'CPAM' : 'Privé';

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: colors.border,
        padding: 18,
        gap: 12,
      }}
    >
      {/* Route */}
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
              backgroundColor: colors.brand,
              borderWidth: 2, borderColor: colors.ink,
              marginRight: 10, marginLeft: -1,
            }}
          />
          <Text style={{ fontSize: 15, fontWeight: '500', color: colors.inkMuted, flex: 1 }}>{mission.destination}</Text>
        </View>
      </View>

      {/* Badge + heure + urgent */}
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
        <View
          style={{
            paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4,
            backgroundColor: isCpam ? colors.dangerSoft : colors.accentSoft,
          }}
        >
          <Text
            style={{
              fontSize: 11, fontWeight: '800', letterSpacing: 0.4,
              color: isCpam ? colors.danger : colors.accent,
            }}
          >
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

      {/* Prix + distance course */}
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

function DetailsCard({ mission }: { mission: Mission }) {
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
        backgroundColor: colors.surface,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: colors.border,
        padding: 18,
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: '800', color: colors.inkMuted, marginBottom: 10, letterSpacing: 0.3 }}>
        DÉTAILS
      </Text>
      {rows.map(([label, value], idx) => (
        <View
          key={label}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingVertical: 8,
            borderTopWidth: idx === 0 ? 0 : 1,
            borderTopColor: colors.border,
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

function NotesCard({ text, title }: { text: string; title: string }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: colors.border,
        padding: 18,
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: '800', color: colors.inkMuted, marginBottom: 8, letterSpacing: 0.3 }}>
        {title.toUpperCase()}
      </Text>
      <Text style={{ fontSize: 14, color: colors.ink, lineHeight: 20 }}>{text}</Text>
    </View>
  );
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h < 24) return m === 0 ? `${h}h` : `${h}h ${m}`;
  const d = Math.floor(h / 24);
  const remH = h % 24;
  return remH === 0 ? `${d}j` : `${d}j ${remH}h`;
}
