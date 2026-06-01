import { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/icons/Icon';
import { useTheme } from '@/lib/theme';
import type { PosterCourseState } from './usePosterCourse';

interface Props {
  voice: PosterCourseState['voice'];
}

/**
 * Gros CTA micro en haut du formulaire. 3 états :
 * - Idle : "Tout dicter à la voix" (fond crème + bordure jaune)
 * - Listening : pulse rouge + "Je t'écoute… Clique pour stopper"
 * - Processing : "L'IA remplit les champs…"
 */
export function PosterMicCta({ voice }: Props) {
  const { colors, isDark } = useTheme();
  const isListening = voice.isListening;
  const isProcessing = voice.isProcessing;
  const pulse = useAnimatedPulse(isListening || isProcessing);

  // États visuels :
  // - Idle : fond muted, bordure brand (jaune)
  // - Listening : fond dangerSoft, bordure danger
  // - Processing : fond brand soft, bordure brand
  const bg = isListening ? colors.dangerSoft : isProcessing ? colors.surfaceMuted : colors.surfaceMuted;
  // Idle/Processing : bordure neutre (gris très clair) au lieu du jaune brand
  // qui faisait un halo trop prononcé. Listening reste en rouge pour le focus.
  const border = isListening ? colors.danger : colors.border;
  const title = isListening ? 'J\'écoute — appuie pour arrêter' : isProcessing ? 'L\'IA remplit les champs…' : 'Tout dicter à la voix';
  const sub = isListening
    ? 'Type, adresses, heure, prix… le micro se coupe au silence.'
    : isProcessing
    ? 'Cela prend 5 à 10 secondes — patientez'
    : 'Le micro remplit type, adresses, heure et prix tout seul';

  // Disque mic central : rouge plein quand listening, sinon noir/accent
  const discBg = isListening ? colors.danger : (isDark ? colors.accent : '#0F0F0F');

  return (
    <View style={{ marginBottom: 16 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingVertical: 14,
          paddingHorizontal: 14,
          backgroundColor: bg,
          borderWidth: 1,
          borderColor: border,
          borderRadius: 18,
          overflow: 'hidden',
        }}
      >
        <Animated.View
          style={{
            width: 72, height: 72, borderRadius: 36,
            backgroundColor: discBg,
            alignItems: 'center', justifyContent: 'center',
            transform: [{ scale: pulse }],
          }}
        >
          {isListening ? (
            <View style={{ width: 20, height: 20, borderRadius: 4, backgroundColor: '#FFFFFF' }} />
          ) : (
            // En light : disc noir → icone jaune brand. En dark : disc bleu
            // (colors.accent) → icone doit etre BLANC (brandInk) sinon meme
            // teinte que le fond → invisible. colors.brand est aussi bleu en dark.
            <Icon name="mic" size={38} color={isDark ? colors.brandInk : colors.brand} strokeWidth={2.2} />
          )}
        </Animated.View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 15, fontWeight: '800', color: colors.ink, marginBottom: 2 }} numberOfLines={1}>
            {title}
          </Text>
          <Text numberOfLines={2} style={{ fontSize: 12, color: colors.inkMuted, lineHeight: 17 }}>
            {sub}
          </Text>
        </View>
        <Pressable
          onPress={voice.toggle}
          disabled={isProcessing}
          android_ripple={{ color: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          accessibilityLabel={isListening ? 'Arrêter la dictée' : 'Démarrer la dictée'}
        />
      </View>
      {voice.error && (
        <Text style={{ marginTop: 6, fontSize: 12, fontWeight: '600', color: colors.danger }}>
          {voice.error}
        </Text>
      )}
      {voice.transcript && !isListening && !isProcessing && (
        <Text style={{ marginTop: 6, fontSize: 12, color: colors.inkMuted, fontStyle: 'italic' }} numberOfLines={2}>
          « {voice.transcript} »
        </Text>
      )}
    </View>
  );
}

function useAnimatedPulse(active: boolean) {
  const value = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    let stopped = false;
    if (!active) {
      Animated.timing(value, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      return;
    }
    function loop() {
      if (stopped) return;
      Animated.sequence([
        Animated.timing(value, { toValue: 1.12, duration: 600, useNativeDriver: true }),
        Animated.timing(value, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]).start(() => { if (!stopped) loop(); });
    }
    loop();
    return () => { stopped = true; };
  }, [active, value]);
  return value;
}
