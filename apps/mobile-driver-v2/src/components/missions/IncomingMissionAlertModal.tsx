import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  Vibration,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { missionMutations } from '@taxilink/services';

import { Icon } from '@/components/icons/Icon';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/hooks/useAuth';
import { triggerPushNotifyMissionAccepted } from '@/lib/pushNotifyTrigger';
import { useMissionPopupStore } from './missionPopupStore';

// Modal "Nouvelle annonce dispo" sur la home — remplace Alert.alert natif.
// Branche dans (driver)/_layout.tsx, lit useMissionPopupStore.
//
// 3 actions :
//   - Voir details : navigue vers /mission/:id (lecture seule, le chauffeur
//     decide ensuite)
//   - Accepter    : missionMutations.accept direct + push notif au poster
//   - Refuser     : dismiss (= ignorer, pas de feedback DB)
export function IncomingMissionAlertModal() {
  const data = useMissionPopupStore((s) => s.current);
  const dismiss = useMissionPopupStore((s) => s.dismiss);
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const vibratedFor = useRef<string | null>(null);
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!data) {
      scaleAnim.setValue(0.9);
      setError(null);
      setAccepting(false);
      return;
    }
    if (vibratedFor.current !== data.id) {
      vibratedFor.current = data.id;
      Vibration.vibrate(200);
    }
    Animated.spring(scaleAnim, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }).start();
  }, [data?.id, scaleAnim]);

  if (!data) return null;
  const isCpam = data.variant === 'cpam';

  async function handleAccept() {
    if (!user || !data) return;
    setError(null);
    setAccepting(true);
    try {
      await missionMutations.accept(data.id, user.id);
      triggerPushNotifyMissionAccepted(data.id);
      dismiss();
      router.push(`/mission/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Annonce déjà prise');
      setAccepting(false);
    }
  }

  function handleSeeDetails() {
    dismiss();
    router.push(`/mission/${data!.id}`);
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={dismiss} statusBarTranslucent>
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: isDark ? colors.surface : '#FFFFFF', transform: [{ scale: scaleAnim }] },
          ]}
        >
          <View style={[styles.header, isCpam ? styles.headerCpam : styles.headerPrivate]}>
            <View style={styles.headerIconWrap}>
              <Icon name="bell-ring" size={22} color={isCpam ? '#FFFFFF' : '#1A1A1A'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerKicker, { color: isCpam ? 'rgba(255,255,255,0.85)' : 'rgba(26,26,26,0.7)' }]}>
                Nouvelle annonce
              </Text>
              <Text style={[styles.headerTitle, { color: isCpam ? '#FFFFFF' : '#1A1A1A' }]}>
                {data.title}
              </Text>
            </View>
          </View>

          <View style={styles.body}>
            <View style={styles.row}>
              <Icon name="locate" size={18} color="#1A1A1A" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowLabel, { color: isDark ? colors.inkSoft : '#737582' }]}>Départ</Text>
                <Text style={[styles.rowValue, { color: isDark ? colors.ink : '#1A1A1A' }]} numberOfLines={2}>
                  {data.departure}
                </Text>
              </View>
            </View>

            {error && (
              <View style={styles.errorRow}>
                <Icon name="info" size={14} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.actions}>
              <Pressable
                onPress={dismiss}
                disabled={accepting}
                android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                style={styles.refuseWrap}
              >
                <Text style={styles.refuseText}>Refuser</Text>
              </Pressable>
              <Pressable
                onPress={handleSeeDetails}
                disabled={accepting}
                android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                style={styles.detailsWrap}
              >
                <Text style={styles.detailsText}>Voir détails</Text>
              </Pressable>
            </View>
            <View style={[styles.acceptWrap, { backgroundColor: colors.brand }]}>
              <Pressable
                onPress={handleAccept}
                disabled={accepting}
                android_ripple={{ color: 'rgba(0,0,0,0.15)' }}
                style={styles.acceptInner}
              >
                {accepting ? (
                  <ActivityIndicator color={colors.brandInk} />
                ) : (
                  <>
                    <Text style={[styles.acceptText, { color: colors.brandInk }]}>JE PRENDS</Text>
                    <Icon name="arrow-right" size={18} color={colors.brandInk} />
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', paddingHorizontal: 24 },
  card:           { borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 16 },
  header:         { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 18 },
  headerCpam:     { backgroundColor: '#1D4ED8' },
  headerPrivate:  { backgroundColor: '#FFD11A' },
  headerIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerKicker:   { fontSize: 10, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase' },
  headerTitle:    { fontSize: 18, fontWeight: '900', marginTop: 2 },
  body:           { padding: 20, gap: 14 },
  row:            { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  rowLabel:       { fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  rowValue:       { fontSize: 15, fontWeight: '700', marginTop: 2 },
  errorRow:       { flexDirection: 'row', alignItems: 'center', gap: 6 },
  errorText:      { fontSize: 12, fontWeight: '600', color: '#EF4444', flex: 1 },
  actions:        { flexDirection: 'row', gap: 10, paddingTop: 4 },
  refuseWrap:     { flex: 1, height: 44, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  refuseText:     { fontSize: 13, fontWeight: '700', color: '#737582' },
  detailsWrap:    { flex: 1, height: 44, borderRadius: 12, borderWidth: 1, borderColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  detailsText:    { fontSize: 13, fontWeight: '700', color: '#1A1A1A' },
  acceptWrap:     { height: 52, borderRadius: 14, overflow: 'hidden' },
  acceptInner:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  acceptText:     { fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
});
