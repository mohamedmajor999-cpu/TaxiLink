import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  Vibration,
  View,
} from 'react-native';
import type { Mission } from '@taxilink/supabase-types';

import { Icon } from '@/components/icons/Icon';
import { useIncomingMissionOffer } from '@/hooks/useIncomingMissionOffer';
import { useTheme } from '@/lib/theme';

function formatPrice(min: number | null, max: number | null, exact: number | null): string {
  if (exact != null) return `${exact.toFixed(2)} €`;
  if (min != null && max != null) return `${min.toFixed(2)}–${max.toFixed(2)} €`;
  return '—';
}

function formatHorizon(scheduledAt: string | null): string {
  if (!scheduledAt) return 'Maintenant';
  const ms = new Date(scheduledAt).getTime() - Date.now();
  const min = Math.round(ms / 60_000);
  if (min <= 0) return 'Maintenant';
  if (min < 60) return `Dans ${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `Dans ${h} h` : `Dans ${h} h ${m}`;
}

/**
 * Modal "Course dispo" affiche quand le chauffeur recoit une offre PENDING
 * via la cascade dispatch_mission. Cable directement a useIncomingMissionOffer
 * (pas de props). Auto-ferme quand le countdown atteint 0 ou apres accept/refuse.
 *
 * Mecanique : la cascade priorise les drivers les plus proches du lieu de
 * prise (3 km → 6 → 12 → 20 → 30 km, 20s par palier). Cet ecran est le
 * point d'entree cote driver.
 */
export function IncomingMissionOfferModal() {
  const { state, loading, error, accept, refuse } = useIncomingMissionOffer();
  const { colors, isDark } = useTheme();
  const vibratedFor = useRef<string | null>(null);

  // Vibration alarm-like a l'apparition d'une offre (in-app). Si l'app etait
  // au foreground et qu'aucune push n'a sonne, c'est ici qu'on alerte le user.
  // Pattern long (~1s) volontairement plus marque qu'un simple ping pour
  // distinguer "c'est pour toi" de "nouvelle course generale".
  useEffect(() => {
    if (!state) return;
    if (vibratedFor.current === state.offer.id) return;
    vibratedFor.current = state.offer.id;
    Vibration.vibrate([0, 400, 150, 400]);
  }, [state?.offer.id]);

  if (!state) return null;
  const { offer, mission, secondsLeft } = state;

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={() => {
        // Back hardware Android = refuse explicite, comme un "non merci".
        void refuse();
      }}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            { backgroundColor: isDark ? colors.surface : '#FFFFFF' },
          ]}
        >
          <Header offer={offer} secondsLeft={secondsLeft} />

          <View style={styles.body}>
            <TopRow mission={mission} offer={offer} />
            <Addresses
              departure={mission.departure}
              destination={mission.destination}
              textColor={isDark ? colors.ink : '#1A1A1A'}
            />
            <FarePanel mission={mission} textColor={isDark ? colors.ink : '#1A1A1A'} mutedColor={isDark ? colors.inkSoft : '#737582'} />

            {error && (
              <View style={styles.errorRow}>
                <Icon name="info" size={14} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.actions}>
              <AcceptButton onPress={accept} loading={loading} />
              <RefuseButton onPress={refuse} loading={loading} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Header({
  offer,
  secondsLeft,
}: {
  offer: { sent_at: string; expires_at: string };
  secondsLeft: number;
}) {
  // colors.brand : jaune (#FFD11A) en light, bleu accent (#3B82F6) en dark.
  const { colors } = useTheme();
  const totalDuration = Math.max(
    1,
    Math.round((new Date(offer.expires_at).getTime() - new Date(offer.sent_at).getTime()) / 1000),
  );
  const progressPct = Math.max(0, Math.min(100, (secondsLeft / totalDuration) * 100));
  const widthAnim = useRef(new Animated.Value(progressPct)).current;
  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: progressPct,
      duration: 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, [progressPct, widthAnim]);

  const widthStyle = widthAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  return (
    <View>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name="zap" size={20} color={colors.brand} />
          <Text style={styles.headerLabel}>Course dispo</Text>
        </View>
        <View style={styles.headerCountdown}>
          <Text style={styles.countdownNum}>{secondsLeft}</Text>
          <Text style={styles.countdownUnit}>s</Text>
        </View>
      </View>
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: widthStyle, backgroundColor: colors.brand }]} />
      </View>
    </View>
  );
}

function TopRow({
  mission,
  offer,
}: {
  mission: Mission;
  offer: { distance_km_at_offer: number | null };
}) {
  const isCpam = mission.type === 'CPAM';
  return (
    <View style={styles.topRow}>
      <View style={[styles.badge, isCpam ? styles.badgeCpam : styles.badgePrivate]}>
        <Text style={[styles.badgeText, isCpam ? styles.badgeTextCpam : styles.badgeTextPrivate]}>
          {isCpam ? 'CPAM' : 'Privé'}
        </Text>
      </View>
      <Text style={styles.horizon}>{formatHorizon(mission.scheduled_at)}</Text>
      {offer.distance_km_at_offer != null && (
        <Text style={[styles.horizon, styles.distanceRight]}>
          {offer.distance_km_at_offer.toFixed(1)} km de vous
        </Text>
      )}
    </View>
  );
}

function Addresses({
  departure,
  destination,
  textColor,
}: {
  departure: string;
  destination: string;
  textColor: string;
}) {
  return (
    <View style={styles.addresses}>
      <View style={styles.addressRow}>
        <Icon name="locate" size={16} color="#1A1A1A" />
        <Text style={[styles.addressText, { color: textColor }]} numberOfLines={2}>
          {departure}
        </Text>
      </View>
      <View style={styles.addressRow}>
        <Icon name="map-pin" size={16} color="#EF4444" />
        <Text style={[styles.addressText, { color: textColor }]} numberOfLines={2}>
          {destination}
        </Text>
      </View>
    </View>
  );
}

function FarePanel({
  mission,
  textColor,
  mutedColor,
}: {
  mission: Mission;
  textColor: string;
  mutedColor: string;
}) {
  return (
    <View style={styles.farePanel}>
      <View>
        <Text style={[styles.fareLabel, { color: mutedColor }]}>Distance</Text>
        <Text style={[styles.fareValue, { color: textColor }]}>
          {mission.distance_km != null ? `${mission.distance_km.toFixed(1)} km` : '—'}
          {mission.duration_min != null ? ` · ${mission.duration_min} min` : ''}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[styles.fareLabel, { color: mutedColor }]}>Tarif</Text>
        <Text style={[styles.fareValueBig, { color: textColor }]}>
          {formatPrice(
            (mission as Mission & { price_min_eur?: number | null }).price_min_eur ?? null,
            (mission as Mission & { price_max_eur?: number | null }).price_max_eur ?? null,
            mission.price_eur ?? null,
          )}
        </Text>
      </View>
    </View>
  );
}

function AcceptButton({ onPress, loading }: { onPress: () => void; loading: boolean }) {
  // colors.brand : jaune en light, bleu en dark. brandInk : ink lisible
  // sur ce fond (noir sur jaune, blanc sur bleu).
  const { colors } = useTheme();
  return (
    <View style={[styles.acceptWrapper, { backgroundColor: colors.brand }]}>
      <Pressable
        onPress={onPress}
        disabled={loading}
        android_ripple={{ color: 'rgba(0,0,0,0.15)' }}
        style={styles.acceptInner}
      >
        {loading ? (
          <ActivityIndicator color={colors.brandInk} />
        ) : (
          <>
            <Text style={[styles.acceptText, { color: colors.brandInk }]}>JE PRENDS</Text>
            <Icon name="arrow-right" size={18} color={colors.brandInk} />
          </>
        )}
      </Pressable>
    </View>
  );
}

function RefuseButton({ onPress, loading }: { onPress: () => void; loading: boolean }) {
  return (
    <View style={styles.refuseWrapper}>
      <Pressable
        onPress={onPress}
        disabled={loading}
        android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
        style={styles.refuseInner}
      >
        <Text style={styles.refuseText}>Refuser</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  card: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
  },
  header: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 1.2,
  },
  headerCountdown: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  countdownNum: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  countdownUnit: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFD11A',
  },
  body: {
    padding: 24,
    gap: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    height: 24,
    paddingHorizontal: 10,
    borderRadius: 12,
    justifyContent: 'center',
  },
  badgeCpam: { backgroundColor: '#DBEAFE' },
  badgePrivate: { backgroundColor: '#F3F4F6' },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  badgeTextCpam: { color: '#1D4ED8' },
  badgeTextPrivate: { color: '#1A1A1A' },
  horizon: {
    fontSize: 12,
    fontWeight: '600',
    color: '#737582',
  },
  distanceRight: {
    marginLeft: 'auto',
  },
  addresses: {
    gap: 8,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  farePanel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
  },
  fareLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  fareValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  fareValueBig: {
    fontSize: 20,
    fontWeight: '900',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  actions: {
    gap: 8,
    paddingTop: 4,
  },
  acceptWrapper: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FFD11A',
    overflow: 'hidden',
  },
  acceptInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  acceptText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1A1A1A',
    letterSpacing: 0.5,
  },
  refuseWrapper: {
    height: 40,
    borderRadius: 12,
    overflow: 'hidden',
  },
  refuseInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refuseText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#737582',
  },
});
