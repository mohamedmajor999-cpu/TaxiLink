import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const BARS = [28, 52, 78, 94, 100, 88, 68, 44, 26, 18];

export function SlideIlloVoice() {
  return (
    <View style={{ alignItems: 'center', gap: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', height: 160, gap: 6 }}>
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
          paddingHorizontal: 16,
          paddingVertical: 8,
        }}
      >
        <View style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: '#FFD11A' }} />
        <Text style={{ color: '#FFD11A', fontSize: 11, fontWeight: '800', letterSpacing: 1.6, textTransform: 'uppercase' }}>
          Dictée · 0:03
        </Text>
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
          width: 9,
          height: `${height}%`,
          borderRadius: 999,
          backgroundColor: center ? '#000' : '#FFD11A',
        },
        style,
      ]}
    />
  );
}
