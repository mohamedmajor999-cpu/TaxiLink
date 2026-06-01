import { useEffect, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { Icon } from '@/components/icons/Icon';
import { SideBarDrawer } from '@/components/navigation/SideBarDrawer';
import { PosterPreflight } from '@/components/courses/poster/PosterPreflight';
import { PosterCourseForm } from '@/components/courses/poster/PosterCourseForm';
import { PosterFooter } from '@/components/courses/poster/PosterFooter';
import { VoiceRecordingBanner } from '@/components/courses/poster/VoiceRecordingBanner';
import { VoiceProcessingModal } from '@/components/courses/poster/VoiceProcessingModal';
import { usePosterCourse } from '@/components/courses/poster/usePosterCourse';
import { useDriverDrawer } from '@/hooks/useDriverDrawer';
import { useKeyboardVisible } from '@/hooks/useKeyboardVisible';
import { useTheme } from '@/lib/theme';

export default function PosterCourseScreen() {
  const { quick } = useLocalSearchParams<{ quick?: string }>();
  const c = usePosterCourse();
  const keyboardVisible = useKeyboardVisible();
  const { colors } = useTheme();
  const { drawerProps, openDrawer } = useDriverDrawer({
    activeTab: 'carte',
    // Sur cette page le bouton "Poster une course" du drawer ne sert qu'à fermer
    // (on y est déjà). Override le push automatique vers /poster-course.
    onPostCourse: () => undefined,
  });

  // Après publication : redirige vers le dashboard.
  useEffect(() => {
    if (!c.published) return;
    const t = setTimeout(() => router.replace('/'), 1200);
    return () => clearTimeout(t);
  }, [c.published]);

  // Mode "quick" : déclenché par Volume+ ou un raccourci OS qui ouvre
  // taxilink-driver://poster-course?quick=1. Si l'user a des préréglages
  // (type sauvé), skip l'étape 1 + démarre le micro auto. Sinon affichage
  // étape 1 normal (l'user choisit puis valide manuellement).
  const quickAppliedRef = useRef(false);
  useEffect(() => {
    if (quick !== '1') return;
    if (quickAppliedRef.current) return;
    if (!c.savedDefaults?.type) return; // pas de préréglage → laisse étape 1
    quickAppliedRef.current = true;
    if (!c.gatePassed) c.setGatePassed(true);
    // Laisse le temps à PosterCourseForm de monter avant de lancer la capture audio.
    const t = setTimeout(() => c.voice.start(), 350);
    return () => clearTimeout(t);
  }, [quick, c.savedDefaults, c.gatePassed, c.setGatePassed, c.voice]);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <PosterHeader
        onMenu={openDrawer}
        onBack={c.gatePassed && !c.published ? () => c.setGatePassed(false) : undefined}
      />

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
              onSubmit={() => c.submit()}
              onSubmitAndShare={() => c.submit({ share: true })}
            />
          )}
        </View>
      )}

      <SideBarDrawer {...drawerProps} />
      <VoiceProcessingModal visible={c.voicesAnyProcessing} />
    </SafeAreaView>
  );
}

function PosterHeader({ onMenu, onBack }: { onMenu: () => void; onBack?: () => void }) {
  const { colors, isDark } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 }}>
      <View style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden' }}>
        <Pressable
          onPress={onMenu}
          accessibilityLabel="Menu"
          android_ripple={{ color: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', borderless: false }}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="menu" size={22} color={colors.ink} strokeWidth={2.2} />
        </Pressable>
      </View>
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
