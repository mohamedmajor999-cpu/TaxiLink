import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const skipColor = isDark ? 'rgba(255,255,255,0.7)' : '#888780';

  return (
    <View style={{ flex: 1, backgroundColor: bg, paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View style={{ height: 56, paddingHorizontal: 20, alignItems: 'flex-end', justifyContent: 'center' }}>
        <Pressable hitSlop={12} onPress={onSkip}>
          <Text style={{ color: skipColor, fontSize: 16, fontWeight: '700' }}>Passer</Text>
        </Pressable>
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, minHeight: 240 }}>
        {illo}
      </View>

      <View style={{ paddingHorizontal: 24, paddingBottom: 8 }}>
        <Text style={{ color: ink, fontSize: 34, fontWeight: '800', letterSpacing: -0.9, lineHeight: 38 }}>
          {title}
        </Text>
        <Text style={{ marginTop: 12, color: leadColor, fontSize: 17, lineHeight: 25 }}>
          {lead}
        </Text>
      </View>

      <View style={{ marginTop: 24, marginBottom: 24 }}>
        <OnboardingDots total={total} active={stepIdx} variant={variant} />
      </View>

      <View style={{ paddingHorizontal: 20, paddingBottom: 24 }}>
        <Pressable
          onPress={onNext}
          android_ripple={{ color: 'rgba(0,0,0,0.12)' }}
          style={({ pressed }) => ({
            height: 60,
            borderRadius: 999,
            backgroundColor: '#FFD11A',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.92 : 1,
          })}
        >
          <Text style={{ color: '#000', fontSize: 17, fontWeight: '800', letterSpacing: -0.2 }}>{nextLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}
