import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import type { Mission } from '@taxilink/supabase-types';
import { missionMutations, missionProgressMutations, missionQueries, reportError } from '@taxilink/services';

import { Icon } from '@/components/icons/Icon';
import { useAuth } from '@/hooks/useAuth';
import { useHoldAccept } from '@/hooks/useHoldAccept';
import { useTheme } from '@/lib/theme';
import { triggerPushNotifyMissionAccepted } from '@/lib/pushNotifyTrigger';
import {
  cancelMissionStartReminder,
  scheduleMissionEndReminder,
  scheduleMissionStartReminder,
} from '@/lib/missionLocalNotifications';
import {
  ContactNavActions,
  DetailsCard,
  HighlightsGrid,
  MaskedNotice,
  NotesCard,
  RouteCard,
  canSeeFullMission,
  maskName,
} from '@/components/mission-detail/missionDetailParts';

// Ecran detail course : header + scroll des cards (highlights, route, contact,
// details, notes) + footer (hold-to-accept ou "Je demarre"). Toute la
// presentation (cards, tiles, boutons brand) vit dans missionDetailParts.tsx
// pour respecter le seuil de 200 lignes par page (CLAUDE.md).
//
// RGPD : tant que la course n'est pas acceptee, nom/telephone/notes sont masques
// via canSeeFullMission + maskName. Les sous-composants Contact/Notes ne sont
// rendus qu'apres acceptation.
export default function MissionDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const [rawMission, setRawMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  const isMasked = rawMission ? !canSeeFullMission(rawMission, user?.id ?? null) : false;
  const mission: Mission | null = rawMission
    ? isMasked
      ? { ...rawMission, patient_name: maskName(rawMission.patient_name), phone: null, notes: null }
      : rawMission
    : null;

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    missionQueries
      .getByIdMasked(id)
      .then((m) => { if (!cancelled) setRawMission(m); })
      .catch((err) => reportError(err, { tags: { phase: 'mission-detail-fetch' } }))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  async function handleConfirmAccept() {
    if (!mission || !user?.id) return;
    setAccepting(true);
    try {
      await missionMutations.accept(mission.id, user.id);
      // Push notif au poster (shared_by) : "<driver> a pris ta course".
      // Fire-and-forget, ne bloque pas le retour utilisateur.
      triggerPushNotifyMissionAccepted(mission.id);
      // Planifie la notif locale rappel "as-tu demarre ?" (5 min apres scheduled_at).
      void scheduleMissionStartReminder(mission);
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

  async function handleStart() {
    if (!mission) return;
    try {
      if (!mission.enroute_at) {
        await missionProgressMutations.markEnRoute(mission.id);
        // Course demarree → annule la notif "demarre ?" + planifie "termine ?"
        void cancelMissionStartReminder(mission.id);
        void scheduleMissionEndReminder(mission);
      }
      router.push(`/mission/${mission.id}/active`);
    } catch (err) {
      reportError(err, { tags: { phase: 'mission-detail-start' } });
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Réessaie dans un instant.');
    }
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 12,
          paddingHorizontal: 16, paddingVertical: 12,
          borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.bg,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Retour"
          style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMuted }}
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
            {!isMasked && <ContactNavActions mission={mission} />}
            <DetailsCard mission={mission} />
            {mission.notes && <NotesCard text={mission.notes} title="Notes" />}
          </ScrollView>

          {mission.status === 'IN_PROGRESS' && (
            <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bg }}>
              <View style={{ height: 56, borderRadius: 12, backgroundColor: isDark ? colors.accent : '#0F0F0F', overflow: 'hidden' }}>
                <Pressable
                  onPress={handleStart}
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

          {mission.status === 'AVAILABLE' && (
            <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bg }}>
              <View style={{ height: 56, borderRadius: 12, overflow: 'hidden' }}>
                <View
                  style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    borderRadius: 12, backgroundColor: isDark ? colors.accent : '#0F0F0F',
                  }}
                />
                <Animated.View
                  pointerEvents="none"
                  style={{
                    position: 'absolute', top: 0, left: 0, bottom: 0,
                    width: fillWidth, backgroundColor: colors.brand, opacity: 0.45,
                  }}
                />
                <View
                  pointerEvents="none"
                  style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
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
