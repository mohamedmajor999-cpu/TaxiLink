import { useEffect, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { Icon } from '@/components/icons/Icon';
import { PosterPreflight } from '@/components/courses/poster/PosterPreflight';
import { PosterCourseForm } from '@/components/courses/poster/PosterCourseForm';
import { PosterFooter } from '@/components/courses/poster/PosterFooter';
import { VoiceRecordingBanner } from '@/components/courses/poster/VoiceRecordingBanner';
import { VoiceProcessingModal } from '@/components/courses/poster/VoiceProcessingModal';
import { usePosterCourse } from '@/components/courses/poster/usePosterCourse';
import { useKeyboardVisible } from '@/hooks/useKeyboardVisible';
import { useTheme } from '@/lib/theme';

// V7 : hamburger + SideBarDrawer supprimes. La BottomNav globale reste visible
// (cf. HIDDEN_PATHS dans BottomNav.tsx) — l'user peut switcher de section
// pendant le formulaire (avec confirmation perte de saisie si necessaire).
export default function PosterCourseScreen() {
  const { quick } = useLocalSearchParams<{ quick?: string }>();
  const c = usePosterCourse();
  const keyboardVisible = useKeyboardVisible();
  const { colors } = useTheme();

  // V7 (mise a jour 2026-05-23) : le choix "Tout le groupe / Personnes choisies"
  // se fait directement a l'etape 1 (Preflight). Plus de sheet en fin de flow.
  // c.targetUserIds est lu par c.submit() pour passer target_user_ids au RPC.

  useEffect(() => {
    if (!c.published) return;
    const t = setTimeout(() => router.replace('/'), 1200);
    return () => clearTimeout(t);
  }, [c.published]);

  const quickAppliedRef = useRef(false);
  useEffect(() => {
    if (quick !== '1') return;
    if (quickAppliedRef.current) return;
    if (!c.savedDefaults?.type) return;
    quickAppliedRef.current = true;
    if (!c.gatePassed) c.setGatePassed(true);
    const t = setTimeout(() => c.voice.start(), 350);
    return () => clearTimeout(t);
  }, [quick, c.savedDefaults, c.gatePassed, c.setGatePassed, c.voice]);


  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <PosterHeader onBack={c.gatePassed && !c.published ? () => c.setGatePassed(false) : undefined} />

      <VoiceRecordingBanner visible={c.voicesAnyListening} onStop={c.stopAllVoiceListening} />

      {c.published ? (
        <SuccessOverlay />
      ) : !c.gatePassed ? (
        <PosterPreflight c={c} />
      ) : (
        <View style={{ flex: 1 }}>
          <View style={{ flex: 1 }}>
            <PosterCourseForm c={c} />
          </View>
          {!keyboardVisible && (
            <PosterFooter
              type={c.type}
              medicalMotif={c.medicalMotif}
              previewFare={c.previewFare}
              distanceKm={c.distanceKm}
              durationMin={c.durationMin}
              loadingRoute={c.loadingRoute}
              saving={c.saving}
              canSubmit={c.canSubmit}
              error={c.error}
              // V7 (2026-05-23) : submit direct, le ciblage individuel est
              // deja choisi a l'etape 1 (Preflight) et lu dans c.submit().
              onSubmit={() => void c.submit({ share: false })}
              onSubmitAndShare={() => void c.submit({ share: true })}
            />
          )}
        </View>
      )}

      <VoiceProcessingModal visible={c.voicesAnyProcessing} />
    </SafeAreaView>
  );
}

function PosterHeader({ onBack }: { onBack?: () => void }) {
  const { colors, isDark } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 }}>
      <Text style={{ fontSize: 22, fontWeight: '900', color: colors.ink, letterSpacing: -0.5 }}>
        Poster une course
      </Text>
      {onBack && (
        <View style={{ marginLeft: 'auto', height: 40, borderRadius: 20, overflow: 'hidden', backgroundColor: colors.surfaceMuted }}>
          <Pressable
            onPress={onBack}
            accessibilityLabel="Revenir à l'étape précédente"
            android_ripple={{ color: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)' }}
            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, height: 40, gap: 6 }}
          >
            <Icon name="arrow-left" size={16} color={colors.ink} strokeWidth={2.4} />
            <Text style={{ fontSize: 13.5, fontWeight: '700', color: colors.ink }}>Retour</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function SuccessOverlay() {
  const { colors, isDark } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, padding: 32 }}>
      <View
        style={{
          width: 96, height: 96, borderRadius: 48,
          backgroundColor: isDark ? colors.success : '#9AE6B4',
          alignItems: 'center', justifyContent: 'center',
          marginBottom: 18,
        }}
      >
        <Icon name="check" size={48} color="#FFFFFF" strokeWidth={3} />
      </View>
      <Text style={{ fontSize: 24, fontWeight: '800', color: colors.ink, letterSpacing: -0.4 }}>
        Annonce publiée !
      </Text>
      <Text style={{ fontSize: 13.5, color: colors.inkMuted, marginTop: 8, textAlign: 'center' }}>
        Ta course est en ligne. Les chauffeurs vont la voir.
      </Text>
    </View>
  );
}
