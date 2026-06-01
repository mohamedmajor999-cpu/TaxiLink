import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { useTheme } from '@/lib/theme';
import { haversineKm } from '@/lib/geo';
import { useIncomingMissionAlertModal, ALERT_COUNTDOWN_MS } from './useIncomingMissionAlertModal';

// Modal "Nouvelle annonce dispo" sur la home — remplace Alert.alert natif.
// Design : preview Mapbox de la route, barre de decompte 20s, prix proeminent,
// stats en pills, timeline de route (pickup → dropoff), CTA "J'accepte".
//
// Branche dans (driver)/_layout.tsx, lit useMissionPopupStore.
export function IncomingMissionAlertModal() {
  const { colors, isDark } = useTheme();
  const { data, accepting, error, driverCoords, slideAnim, fadeAnim, handleAccept, dismiss } =
    useIncomingMissionAlertModal();

  // Barre de decompte : largeur animee de 100% a 0% sur ALERT_COUNTDOWN_MS.
  // Reset a chaque nouvelle annonce (dep sur mission.id uniquement). Lister
  // `data` en dep causait un restart de l'animation a chaque render du parent
  // (data est une nouvelle reference de store a chaque update) → animation
  // qui repart de 100% en boucle + timing.start() empile des animations
  // jamais .stop() → memory leak du driver Animated.
  const timerWidth = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!data) {
      timerWidth.setValue(1);
      return;
    }
    timerWidth.setValue(1);
    const anim = Animated.timing(timerWidth, {
      toValue: 0,
      duration: ALERT_COUNTDOWN_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    anim.start();
    // Stop l'anim au unmount/mission.id change pour ne pas laisser un driver
    // d'animation orphelin tourner en background (deux .start() consecutifs
    // sans .stop() s'empilent).
    return () => anim.stop();
  }, [data?.mission.id]);

  if (!data) return null;

  const m = data.mission;
  const distanceToPickup =
    driverCoords && typeof m.departure_lat === 'number' && typeof m.departure_lng === 'number'
      ? haversineKm(driverCoords, { lat: m.departure_lat, lng: m.departure_lng })
      : null;

  const distanceKmLabel = m.distance_km != null ? `${m.distance_km.toFixed(0)}` : '—';
  const distanceToPickupLabel = distanceToPickup != null
    ? distanceToPickup < 1
      ? distanceToPickup.toFixed(1)
      : distanceToPickup.toFixed(0)
    : '—';

  const priceLabel = formatPrice(m.price_eur, m.price_min_eur, m.price_max_eur);
  const beforeLabel = formatTimeBefore(m.scheduled_at);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={dismiss} statusBarTranslucent>
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Barre de decompte 20s — 6px de haut, jaune brand */}
          <View style={[styles.timerTrack, { backgroundColor: isDark ? colors.surfaceMuted : '#F0F0F2' }]}>
            <Animated.View
              style={[
                styles.timerFill,
                {
                  backgroundColor: colors.brand,
                  width: timerWidth.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                },
              ]}
            />
          </View>

          {/* Preview carte retire 2026-05-24 — user feedback "image de la carte
              inutile". Les infos textuelles (depart/destination/distance) suffisent
              pour decider d'accepter une course. */}

          <View style={styles.body}>
            {/* Hero : eyebrow + titre a gauche, prix a droite */}
            <View style={styles.heroRow}>
              <View style={styles.heroLeft}>
                <View style={styles.eyebrowRow}>
                  <View style={[styles.eyebrowDot, { backgroundColor: colors.brand }]} />
                  <Text style={[styles.eyebrow, { color: colors.inkSoft }]} allowFontScaling={false}>Nouvelle annonce</Text>
                </View>
                <Text style={[styles.title, { color: colors.ink }]}>{data.title}</Text>
              </View>
              <Text style={[styles.price, { color: colors.ink }]} numberOfLines={1}>
                {priceLabel}
              </Text>
            </View>

            {/* 3 colonnes stats : de vous / course km / time before */}
            <View style={[styles.statsRow, { backgroundColor: isDark ? colors.surfaceMuted : '#F7F7F8' }]}>
              <StatCol
                value={distanceToPickupLabel}
                unit="KM"
                label="De vous"
                color={colors.ink}
                soft={colors.inkSoft}
                divider={colors.borderSoft}
              />
              <StatCol
                value={distanceKmLabel}
                unit="KM"
                label="Course"
                color={colors.ink}
                soft={colors.inkSoft}
                divider={colors.borderSoft}
              />
              <StatCol
                value={beforeLabel.value}
                unit={beforeLabel.unit}
                label={beforeLabel.tag}
                color={colors.ink}
                soft={colors.inkSoft}
                divider={colors.borderSoft}
                last
              />
            </View>

            {/* Timeline route : pickup -> dropoff */}
            <View style={styles.route}>
              <View style={[styles.routeConnector, { backgroundColor: colors.borderSoft }]} />
              <RouteStop
                kind="from"
                name={m.departure}
                hint={m.departement ? `Dept. ${m.departement}` : undefined}
                inkColor={colors.ink}
                softColor={colors.inkSoft}
              />
              <RouteStop
                kind="to"
                name={m.destination}
                inkColor={colors.ink}
                softColor={colors.inkSoft}
              />
            </View>

            {error && (
              <View style={styles.errorRow}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* CTA principale full width */}
            <View style={[styles.acceptWrap, { backgroundColor: colors.brand }]}>
              <Pressable
                onPress={handleAccept}
                disabled={accepting}
                android_ripple={{ color: 'rgba(0,0,0,0.12)' }}
                style={styles.acceptInner}
              >
                {accepting ? (
                  <ActivityIndicator color={colors.brandInk} />
                ) : (
                  <Text style={[styles.acceptText, { color: colors.brandInk }]}>J&apos;ACCEPTE LA COURSE</Text>
                )}
              </Pressable>
            </View>

            {/* Actions secondaires : Voir details + Refuser */}
            <View style={styles.secondaryRow}>
              <Pressable
                onPress={() => {
                  dismiss();
                  router.push(`/mission/${m.id}`);
                }}
                disabled={accepting}
                android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                style={styles.linkWrap}
              >
                <Text style={[styles.linkText, { color: colors.inkSoft }]}>Voir détails</Text>
              </Pressable>
              <Text style={[styles.linkSep, { color: colors.borderSoft }]} allowFontScaling={false}>·</Text>
              <Pressable
                onPress={dismiss}
                disabled={accepting}
                android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                style={styles.linkWrap}
              >
                <Text style={[styles.linkText, { color: colors.inkSoft }]}>Refuser</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// === Sous-composants presentation ===

function StatCol({
  value, unit, label, color, soft, divider, last,
}: {
  value: string; unit: string; label: string;
  color: string; soft: string; divider: string;
  last?: boolean;
}) {
  return (
    <>
      <View style={styles.statCol}>
        <View style={styles.statValueRow}>
          <Text style={[styles.statValue, { color }]}>{value}</Text>
          {unit ? <Text style={[styles.statUnit, { color: soft }]} allowFontScaling={false}>{unit}</Text> : null}
        </View>
        <Text style={[styles.statLabel, { color: soft }]} allowFontScaling={false}>{label}</Text>
      </View>
      {!last && <View style={[styles.statDivider, { backgroundColor: divider }]} />}
    </>
  );
}

function RouteStop({
  kind, name, hint, inkColor, softColor,
}: {
  kind: 'from' | 'to'; name: string; hint?: string;
  inkColor: string; softColor: string;
}) {
  return (
    <View style={styles.routeStop}>
      <View
        style={[
          styles.routePinBase,
          kind === 'from'
            ? { backgroundColor: '#FFFFFF', borderColor: '#22C55E', borderWidth: 4 }
            : { backgroundColor: '#0A0A0B', borderColor: '#FFFFFF', borderWidth: 3 },
        ]}
      />
      <View style={styles.routeStopText}>
        <Text style={[styles.routeStopName, { color: inkColor }]} numberOfLines={2}>{name}</Text>
        {hint ? <Text style={[styles.routeStopHint, { color: softColor }]}>{hint}</Text> : null}
      </View>
    </View>
  );
}

// === Helpers format ===

function formatPrice(eur: number | null, min: number | null, max: number | null): string {
  if (eur != null && eur > 0) return `${eur.toFixed(0)} €`;
  if (min != null && max != null) return `${min.toFixed(0)}–${max.toFixed(0)} €`;
  if (min != null) return `dès ${min.toFixed(0)} €`;
  return '—';
}

interface BeforeLabel { value: string; unit: string; tag: string }
function formatTimeBefore(iso: string | null): BeforeLabel {
  if (!iso) return { value: '—', unit: '', tag: 'Avant' };
  const ms = new Date(iso).getTime() - Date.now();
  if (!Number.isFinite(ms)) return { value: '—', unit: '', tag: 'Avant' };
  if (ms < 60_000) return { value: 'Now', unit: '', tag: 'Départ' };
  const min = Math.round(ms / 60_000);
  if (min < 60) return { value: String(min), unit: 'MIN', tag: 'Départ' };
  const h = Math.floor(min / 60);
  const remMin = min % 60;
  if (h < 24) return { value: `${h}h${remMin > 0 ? String(remMin).padStart(2, '0') : ''}`, unit: '', tag: 'Départ' };
  const days = Math.round(h / 24);
  return { value: String(days), unit: 'J', tag: 'Départ' };
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    // Garde la card a une largeur "phone" meme sur foldable Android ouvert
    // (Galaxy Z Fold ~700px) ou si l'app tourne en paysage par accident :
    // sans cap, la card s'etire en bandeau et devient illisible.
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.20,
    shadowRadius: 40,
    elevation: 24,
  },
  timerTrack: { height: 6, width: '100%', overflow: 'hidden' },
  timerFill: { height: 6 },

  body: { padding: 20, gap: 16 },

  heroRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  heroLeft: { flex: 1 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  eyebrowDot: { width: 6, height: 6, borderRadius: 3 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase' },
  title: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5, lineHeight: 24 },
  price: { fontSize: 30, fontWeight: '900', letterSpacing: -1, lineHeight: 30 },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 12,
  },
  statCol: { flex: 1, alignItems: 'center', gap: 4 },
  statValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  statValue: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  statUnit: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
  statLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
  statDivider: { width: 1, height: 28 },

  route: { paddingLeft: 4, gap: 12, position: 'relative' },
  routeConnector: {
    position: 'absolute',
    left: 11,
    top: 16,
    bottom: 16,
    width: 2,
    borderRadius: 1,
  },
  routeStop: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  routePinBase: { width: 18, height: 18, borderRadius: 9, marginTop: 2 },
  routeStopText: { flex: 1 },
  routeStopName: { fontSize: 14, fontWeight: '700', letterSpacing: -0.2, lineHeight: 18 },
  routeStopHint: { fontSize: 12, fontWeight: '600', marginTop: 2 },

  errorRow: { paddingVertical: 4 },
  errorText: { fontSize: 12, fontWeight: '600', color: '#EF4444' },

  acceptWrap: { height: 54, borderRadius: 14, overflow: 'hidden' },
  acceptInner: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  acceptText: { fontSize: 15, fontWeight: '900', letterSpacing: 1 },

  secondaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, paddingTop: 2 },
  linkWrap: { paddingHorizontal: 8, paddingVertical: 4 },
  linkText: { fontSize: 13, fontWeight: '700' },
  linkSep: { fontSize: 14, fontWeight: '700' },
});
