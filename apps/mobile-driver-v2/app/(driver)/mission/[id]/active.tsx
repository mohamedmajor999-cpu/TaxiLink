import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import type { Mission } from '@taxilink/supabase-types';
import { missionMutations, missionProgressMutations, missionQueries, reportError } from '@taxilink/services';

import { Icon, type IconName } from '@/components/icons/Icon';
import { GoogleMapsLogo, WazeLogo } from '@/components/icons/BrandLogos';
import { useTheme } from '@/lib/theme';
import { useGpsPref } from '@/hooks/useGpsPref';
import { ActiveMissionMap } from '@/components/active/ActiveMissionMap';
import { useGeofenceProgress } from '@/components/active/useGeofenceProgress';

type Step = 'enroute' | 'arrived_pickup' | 'onboard' | 'arrived_dest' | 'dropped' | 'done';

// Etat de la course derive des timestamps progress (cf. migration
// 20260501_missions_progress_timestamps.sql). Source unique de verite.
function getStep(m: Mission): Step {
  if (m.status === 'DONE') return 'done';
  if (m.dropoff_at) return 'dropped';
  if (m.arrived_at_dest_at) return 'arrived_dest';
  if (m.pickup_at) return 'onboard';
  if (m.arrived_at_pickup_at) return 'arrived_pickup';
  return 'enroute';
}

const STEP_TITLE: Record<Step, string> = {
  enroute: 'En route vers le patient',
  arrived_pickup: 'Au point de prise en charge',
  onboard: 'Patient à bord',
  arrived_dest: 'Arrivé à destination',
  dropped: 'Patient déposé',
  done: 'Course terminée',
};

const STEP_CTA: Record<Step, string> = {
  enroute: 'Je suis arrivé chez le patient',
  arrived_pickup: 'Patient à bord',
  onboard: 'Je suis arrivé à destination',
  arrived_dest: 'Patient déposé',
  dropped: 'Terminer la course',
  done: 'Course terminée',
};

export default function ActiveCourseRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const gpsPref = useGpsPref();
  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    missionQueries
      .getById(id)
      .then((m) => { if (!cancelled) setMission(m); })
      .catch((err) => reportError(err, { tags: { phase: 'active-fetch' } }))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const step = mission ? getStep(mission) : null;

  // Destination GPS : adresse de pickup tant que pas a bord, sinon destination
  const navDest = !mission ? null
    : step === 'enroute' || step === 'arrived_pickup'
    ? { lat: mission.departure_lat, lng: mission.departure_lng, label: mission.departure }
    : { lat: mission.destination_lat, lng: mission.destination_lng, label: mission.destination };
  const hasCoords = navDest?.lat != null && navDest?.lng != null;

  // Geofence GPS auto : declenche `markArrivedAtPickup` ou `markArrivedAtDest`
  // sans clic quand le chauffeur est physiquement sur place (80m/100m, dwell 2 min).
  // Les boutons manuels restent dispos en parallele en cas d'imprecision GPS.
  useGeofenceProgress({
    mission,
    step,
    onAutoAdvance: async (target) => {
      if (!mission) return;
      try {
        if (target === 'pickup') {
          await missionProgressMutations.markArrivedAtPickup(mission.id);
        } else {
          await missionProgressMutations.markArrivedAtDest(mission.id);
        }
        const refreshed = await missionQueries.getById(mission.id);
        setMission(refreshed);
      } catch (err) {
        reportError(err, { tags: { phase: 'active-geofence-advance', target } });
      }
    },
  });

  async function advance() {
    if (!mission || !step) return;
    setBusy(true);
    try {
      switch (step) {
        case 'enroute': await missionProgressMutations.markArrivedAtPickup(mission.id); break;
        case 'arrived_pickup': await missionProgressMutations.markOnBoard(mission.id); break;
        case 'onboard': await missionProgressMutations.markArrivedAtDest(mission.id); break;
        case 'arrived_dest': await missionProgressMutations.markDropped(mission.id); break;
        case 'dropped': await missionMutations.complete(mission.id); router.back(); return;
        case 'done': router.back(); return;
      }
      const refreshed = await missionQueries.getById(mission.id);
      setMission(refreshed);
    } catch (err) {
      reportError(err, { tags: { phase: 'active-advance', step } });
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Réessaie dans un instant.');
    } finally {
      setBusy(false);
    }
  }

  function open(url: string) { Linking.openURL(url).catch((err) => reportError(err, { tags: { phase: 'active-open' } })); }
  function openMaps() { if (hasCoords) open(`https://www.google.com/maps/dir/?api=1&destination=${navDest!.lat},${navDest!.lng}&travelmode=driving`); }
  function openWaze() { if (hasCoords) open(`https://waze.com/ul?ll=${navDest!.lat}%2C${navDest!.lng}&navigate=yes`); }
  function call() { if (mission?.phone) open(`tel:${mission.phone.replace(/\s/g, '')}`); }
  function sms() {
    if (!mission?.phone) return;
    const firstName = mission.patient_name?.trim().split(/\s+/)[0] ?? null;
    const body = `${firstName ? `Bonjour ${firstName}` : 'Bonjour'}, je suis en route pour vous chercher. A tout de suite.`;
    open(`sms:${mission.phone.replace(/\s/g, '')}?body=${encodeURIComponent(body)}`);
  }

  if (loading || !mission || !step) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.brand} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header minimal : close + title step */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 }}>
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Fermer"
          style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMuted }}
        >
          <Icon name="chevron-down" size={22} color={colors.ink} strokeWidth={2.2} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: colors.inkSoft, letterSpacing: 0.4 }}>COURSE EN COURS</Text>
          <Text numberOfLines={1} style={{ fontSize: 16, fontWeight: '800', color: colors.ink }}>{STEP_TITLE[step]}</Text>
        </View>
      </View>

      {/* Panel haut : VRAIE carte Leaflet (pin destination rouge + position
          chauffeur live bleu) + barre nav native par-dessous. */}
      <View style={{ flex: 1, marginHorizontal: 16, marginTop: 8, borderRadius: 18, overflow: 'hidden', backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border }}>
        {hasCoords ? (
          <ActiveMissionMap destLat={navDest!.lat!} destLng={navDest!.lng!} />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 }}>
            <Icon name="map-pin" size={32} color={colors.inkSoft} strokeWidth={1.6} />
            <Text style={{ fontSize: 11, fontWeight: '800', color: colors.inkSoft, letterSpacing: 0.4 }}>DESTINATION</Text>
            <Text numberOfLines={3} style={{ fontSize: 15, fontWeight: '700', color: colors.ink, textAlign: 'center' }}>{navDest?.label ?? '—'}</Text>
          </View>
        )}
        {/* Barre adresse + boutons navigation natifs (priorite : pref user) */}
        <View style={{ padding: 12, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface, gap: 10 }}>
          <Text numberOfLines={2} style={{ fontSize: 13, fontWeight: '700', color: colors.ink, paddingHorizontal: 2 }}>
            {navDest?.label ?? '—'}
          </Text>
          {hasCoords && (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(gpsPref === 'ask' || gpsPref === 'maps') && (
                <BigNavBtn logo={<GoogleMapsLogo size={22} />} label="Google Maps" onPress={openMaps} />
              )}
              {(gpsPref === 'ask' || gpsPref === 'waze') && (
                <BigNavBtn logo={<WazeLogo size={22} />} label="Waze" onPress={openWaze} />
              )}
            </View>
          )}
        </View>
      </View>

      {/* Panel bas : infos + contact + CTA */}
      <View style={{ padding: 16, gap: 12 }}>
        {mission.patient_name && (
          <Text style={{ fontSize: 17, fontWeight: '800', color: colors.ink }}>{mission.patient_name}</Text>
        )}
        {mission.phone && (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <ActionBtn icon="phone" label="Appeler" onPress={call} accent="#10B981" />
            <ActionBtn icon="message-square" label="J'arrive" onPress={sms} accent="#0EA5E9" />
          </View>
        )}
        <CtaButton label={STEP_CTA[step]} onPress={advance} busy={busy} isDark={isDark} accent={colors.brand} />
      </View>
    </SafeAreaView>
  );
}

function BigNavBtn({ logo, label, onPress }: { logo: ReactNode; label: string; onPress: () => void }) {
  const { colors, isDark } = useTheme();
  return (
    <View style={{ flex: 1, height: 52, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, overflow: 'hidden' }}>
      <Pressable
        onPress={onPress}
        android_ripple={{ color: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
      >
        {logo}
        <Text style={{ fontSize: 14, fontWeight: '800', color: colors.ink }}>{label}</Text>
      </Pressable>
    </View>
  );
}

function ActionBtn({ icon, label, onPress, accent }: { icon: IconName; label: string; onPress: () => void; accent: string }) {
  const { colors, isDark } = useTheme();
  return (
    <View style={{ flex: 1, height: 52, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, overflow: 'hidden' }}>
      <Pressable
        onPress={onPress}
        android_ripple={{ color: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
      >
        <Icon name={icon} size={18} color={accent} strokeWidth={2.2} />
        <Text style={{ fontSize: 14, fontWeight: '800', color: colors.ink }}>{label}</Text>
      </Pressable>
    </View>
  );
}

function CtaButton({ label, onPress, busy, isDark, accent }: { label: string; onPress: () => void; busy: boolean; isDark: boolean; accent: string }) {
  return (
    <View style={{ height: 60, borderRadius: 14, backgroundColor: isDark ? accent : '#0F0F0F', overflow: 'hidden' }}>
      <Pressable
        onPress={onPress}
        disabled={busy}
        android_ripple={{ color: 'rgba(255,255,255,0.15)' }}
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: busy ? 0.6 : 1 }}
      >
        {busy ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={{ fontSize: 16, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.3 }}>{label}</Text>
        )}
      </Pressable>
    </View>
  );
}
