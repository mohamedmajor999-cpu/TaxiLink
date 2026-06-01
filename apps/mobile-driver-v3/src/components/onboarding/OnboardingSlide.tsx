import type { ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { OnboardingDots } from './OnboardingDots';

interface Props {
  variant: 'light' | 'dark';
  title: ReactNode;
  lead: string;
  illo: ReactNode;
  stepIdx: number;
  total: number;
  onNext: () => void;
  onSkip: () => void;
  nextLabel?: string;
}

export function OnboardingSlide({
  variant, title, lead, illo, stepIdx, total, onNext, onSkip, nextLabel = 'Continuer',
}: Props) {
  const insets = useSafeAreaInsets();
  const isDark = variant === 'dark';
  const bg = isDark ? '#0A0A0A' : '#FFFFFF';
  const ink = isDark ? '#FFFFFF' : '#000000';
  const leadColor = isDark ? 'rgba(255,255,255,0.62)' : '#5F5E5A';
  const skipColor = isDark ? 'rgba(255,255,255,0.7)' : '#9CA3AF';
  const skipBorder = isDark ? 'rgba(255,255,255,0.18)' : '#E5E7EB';

  // Samsung One UI + nav gestuelle + edge-to-edge : insets.bottom retourne 0
  // alors que la gesture hint bar fait ~48dp → le bouton sticky se faisait
  // recouvrir physiquement par l'OS, invisible malgre elevation/shadow.
  // Floor 24dp minimum pour garantir un degagement sous la nav-bar systeme.
  // Cf. GitHub safe-area-context #663 (S24 FE) et #667.
  const safeBottom = Math.max(insets.bottom, 24);

  return (
    <View style={{ flex: 1, backgroundColor: bg, paddingTop: insets.top }}>
      {/* Contenu haut : skip + illo + titre + lead + dots dans un ScrollView.
          Avant : flex:1 sur l'illo pour pousser le bouton en bas. Probleme :
          sur ecrans courts OU avec font scale Android > 130%, le total
          natural-height depassait le viewport, et le bouton "Continuer" du
          bas se retrouvait clippe en dehors de l'ecran (rapporte 2026-05-24).
          Maintenant : ScrollView garantit que tout est atteignable et le
          bouton est sticky en bas, toujours visible. */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ height: 56, paddingHorizontal: 20, alignItems: 'flex-end', justifyContent: 'center' }}>
          <Pressable
            hitSlop={12}
            onPress={onSkip}
            android_ripple={{ color: 'rgba(0,0,0,0.08)', borderless: true }}
            style={({ pressed }) => ({
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: skipBorder,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ color: skipColor, fontSize: 13, fontWeight: '700' }}>Passer</Text>
          </Pressable>
        </View>

        <View style={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, minHeight: 240, paddingVertical: 16 }}>
          {illo}
        </View>

        <View style={{ paddingHorizontal: 24, paddingBottom: 8 }}>
          <Text style={{ color: ink, fontSize: 30, fontWeight: '800', letterSpacing: -0.9, lineHeight: 36 }}>
            {title}
          </Text>
          <Text style={{ marginTop: 12, color: leadColor, fontSize: 16, lineHeight: 24 }}>
            {lead}
          </Text>
        </View>

        <View style={{ marginTop: 20, marginBottom: 8 }}>
          <OnboardingDots total={total} active={stepIdx} variant={variant} />
        </View>
      </ScrollView>

      {/* Bouton sticky en bas, jamais clippe. width 100% + ombre forte +
          backdrop blanc opaque sous la ScrollView pour qu'il soit
          IMPOSSIBLEMENT manque (rapport user 2026-05-25 "boton continuer
          en bas qui s'affiche pas"). */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 14,
          paddingBottom: safeBottom + 16,
          backgroundColor: bg,
          // Ombre vers le haut pour decoller visuellement du contenu defilable.
          shadowColor: '#000',
          shadowOpacity: isDark ? 0 : 0.08,
          shadowOffset: { width: 0, height: -4 },
          shadowRadius: 8,
          elevation: 12,
        }}
      >
        <Pressable
          onPress={onNext}
          android_ripple={{ color: 'rgba(255,255,255,0.18)' }}
          style={({ pressed }) => ({
            width: '100%',
            height: 60,
            borderRadius: 999,
            backgroundColor: isDark ? '#FFFFFF' : '#000000',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            opacity: pressed ? 0.9 : 1,
            shadowColor: '#000',
            shadowOpacity: 0.25,
            shadowOffset: { width: 0, height: 8 },
            shadowRadius: 14,
            elevation: 8,
          })}
        >
          <Text
            style={{
              color: isDark ? '#000000' : '#FFFFFF',
              fontSize: 17,
              fontWeight: '800',
              letterSpacing: -0.2,
              textAlign: 'center',
            }}
          >
            {nextLabel}
          </Text>
          <Arrow color={isDark ? '#000000' : '#FFFFFF'} />
        </Pressable>
      </View>
    </View>
  );
}

function Arrow({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h14M13 6l6 6-6 6" stroke={color} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
