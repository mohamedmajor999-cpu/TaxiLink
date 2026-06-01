import { useEffect } from 'react';
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function SlideIlloLongPress() {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) }), -1, false);
  }, [t]);

  const ringProps = useAnimatedProps(() => ({
    r: 22 + t.value * 8,
    opacity: 0.5 - t.value * 0.5,
  }));

  return (
    <Svg width={260} height={220} viewBox="0 0 280 240" fill="none">
      <Path
        d="M40 160 L40 120 Q40 108 50 105 L75 98 L95 72 Q100 65 110 65 L190 65 Q200 65 205 72 L225 98 L250 105 Q260 108 260 120 L260 160"
        stroke="#000" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"
      />
      <Rect x={125} y={52} width={50} height={16} rx={2} fill="#FFD11A" stroke="#000" strokeWidth={2.5} />
      <SvgText x={150} y={64} textAnchor="middle" fontWeight="800" fontSize={10} fill="#000">TAXI</SvgText>
      <Path d="M95 98 L110 78 L190 78 L205 98 Z" fill="#FFD11A" stroke="#000" strokeWidth={2.5} strokeLinejoin="round" />
      <Line x1={150} y1={78} x2={150} y2={98} stroke="#000" strokeWidth={2} />
      <Rect x={40} y={125} width={220} height={8} fill="#000" />
      <Circle cx={85} cy={170} r={18} fill="#fff" stroke="#000" strokeWidth={3} />
      <Circle cx={85} cy={170} r={6} fill="#000" />
      <Circle cx={215} cy={170} r={18} fill="#fff" stroke="#000" strokeWidth={3} />
      <Circle cx={215} cy={170} r={6} fill="#000" />
      <Rect x={180} y={125} width={60} height={100} rx={10} fill="#000" />
      <Rect x={185} y={132} width={50} height={80} rx={4} fill="#FFD11A" />
      <Circle cx={210} cy={172} r={10} fill="#000" />
      <Circle cx={210} cy={172} r={18} fill="none" stroke="#000" strokeWidth={2.5} />
      <AnimatedCircle
        cx={210} cy={172}
        fill="none" stroke="#000" strokeWidth={2} strokeDasharray="4 4"
        animatedProps={ringProps}
      />
    </Svg>
  );
}
