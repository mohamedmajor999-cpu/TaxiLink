import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const BARS = [28, 52, 78, 94, 100, 88, 68, 44, 26, 18];
const TRANSCRIPT = '"Aéroport Marignane → Vieux-Port, 18h30, 4 pax"';

export function SlideIlloVoice() {
  return (
    <View style={{ alignItems: 'center', gap: 18, width: '100%' }}>
      <MicPulse />

      <View style={{ flexDirection: 'row', alignItems: 'center', height: 64, gap: 5 }}>
        {BARS.map((h, i) => (
          <VoiceBar key={i} index={i} height={h} center={i === 4} />
        ))}
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          backgroundColor: '#000',
          borderRadius: 999,
          paddingHorizontal: 14,
          paddingVertical: 7,
        }}
      >
        <View style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: '#EF4444' }} />
        <Text style={{ color: '#FFD11A', fontSize: 11, fontWeight: '800', letterSpacing: 1.6 }}>
          DICTÉE · 0:03
        </Text>
      </View>

      <TranscriptBubble />
    </View>
  );
}

function MicPulse() {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.out(Easing.ease) }),
      -1,
      false,
    );
  }, [pulse]);

  const haloStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 1.3 }],
    opacity: 0.45 * (1 - pulse.value),
  }));

  return (
    <View style={{ width: 72, height: 72, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: 72,
            height: 72,
            borderRadius: 999,
            backgroundColor: '#FFD11A',
          },
          haloStyle,
        ]}
      />
      <View
        style={{
          width: 60,
          height: 60,
          borderRadius: 999,
          backgroundColor: '#000',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"
            stroke="#FFD11A" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"
          />
          <Path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="#FFD11A" strokeWidth={2.2} strokeLinecap="round" />
          <Line x1={12} y1={19} x2={12} y2={22} stroke="#FFD11A" strokeWidth={2.2} strokeLinecap="round" />
        </Svg>
      </View>
    </View>
  );
}

function VoiceBar({ index, height, center }: { index: number; height: number; center: boolean }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withDelay(
      index * 90,
      withRepeat(
        withSequence(
          withTiming(0.35, { duration: 450, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 450, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      ),
    );
  }, [index, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scaleY: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          width: 6,
          height: `${height}%`,
          borderRadius: 999,
          backgroundColor: center ? '#000' : '#FFD11A',
        },
        style,
      ]}
    />
  );
}

function TranscriptBubble() {
  const [chars, setChars] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setChars((c) => (c >= TRANSCRIPT.length + 8 ? 0 : c + 1));
    }, 90);
    return () => clearInterval(id);
  }, []);

  const visible = TRANSCRIPT.slice(0, Math.min(chars, TRANSCRIPT.length));
  const blink = chars % 2 === 0;

  return (
    <View
      style={{
        width: '100%',
        maxWidth: 320,
        backgroundColor: '#F4F4F5',
        borderRadius: 16,
        borderTopLeftRadius: 4,
        padding: 12,
      }}
    >
      <Text style={{ fontSize: 10, fontWeight: '800', color: '#9CA3AF', letterSpacing: 1, marginBottom: 4 }}>
        TRANSCRIPTION
      </Text>
      <Text style={{ fontSize: 13, color: '#111827', fontWeight: '600', lineHeight: 18 }}>
        {visible}
        <Text style={{ color: blink ? '#FFD11A' : 'transparent' }}>▌</Text>
      </Text>
    </View>
  );
}
