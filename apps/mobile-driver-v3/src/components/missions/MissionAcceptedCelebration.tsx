import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Icon } from '@/components/icons/Icon';

interface Props {
  onDone: () => void;
}

// Duree totale de la celebration : pouce qui pop, confettis qui tombent, fade out final.
const TOTAL_DURATION = 3000;
const PARTICLE_COUNT = 80;

const PARTICLE_COLORS = [
  '#FFD23F', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#06B6D4',
];

interface ParticleSpec {
  id: number;
  x: number;          // % horizontal de depart
  delay: number;      // ms avant chute
  duration: number;   // ms de chute
  size: number;
  color: string;
  rotation: number;   // deg de depart
  shape: 'square' | 'circle';
  drift: number;      // px de derive horizontale
}

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function makeParticles(): ParticleSpec[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    x: rand(0, 100),
    delay: rand(0, 600),
    duration: rand(1600, 2200),
    size: rand(6, 14),
    color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)] ?? '#FFD23F',
    rotation: rand(0, 360),
    shape: Math.random() > 0.5 ? 'square' : 'circle',
    drift: rand(-60, 60),
  }));
}

export function MissionAcceptedCelebration({ onDone }: Props) {
  useEffect(() => {
    const timer = setTimeout(onDone, TOTAL_DURATION);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <ConfettiLayer />
      <Center />
    </View>
  );
}

function Center() {
  // Pop : -20deg / scale 0.4 -> 8deg / scale 1.12 -> 0deg / scale 1.
  const popProgress = useSharedValue(0);
  const fade = useSharedValue(1);

  useEffect(() => {
    popProgress.value = withTiming(1, { duration: 600, easing: Easing.bezier(0.34, 1.56, 0.64, 1) });
    // 75% du temps total visible, puis fade out 25%.
    fade.value = withDelay(
      Math.floor(TOTAL_DURATION * 0.75),
      withTiming(0, { duration: TOTAL_DURATION - Math.floor(TOTAL_DURATION * 0.75), easing: Easing.in(Easing.ease) }),
    );
    return () => {
      cancelAnimation(popProgress);
      cancelAnimation(fade);
    };
  }, [popProgress, fade]);

  const thumbStyle = useAnimatedStyle(() => {
    // Interpolation manuelle pour reproduire les 3 keyframes 0/55/100.
    const p = popProgress.value;
    let rotate: number;
    let scale: number;
    let opacity: number;
    if (p < 0.55) {
      const t = p / 0.55;
      rotate = -20 + (8 - -20) * t;
      scale = 0.4 + (1.12 - 0.4) * t;
      opacity = t;
    } else {
      const t = (p - 0.55) / 0.45;
      rotate = 8 + (0 - 8) * t;
      scale = 1.12 + (1 - 1.12) * t;
      opacity = 1;
    }
    return {
      opacity,
      transform: [{ rotate: `${rotate}deg` }, { scale }],
    };
  });

  const textProgress = useSharedValue(0);
  useEffect(() => {
    textProgress.value = withDelay(350, withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) }));
    return () => cancelAnimation(textProgress);
  }, [textProgress]);

  const textStyle = useAnimatedStyle(() => ({
    opacity: textProgress.value,
    transform: [{ translateY: 8 - 8 * textProgress.value }],
  }));

  const fadeStyle = useAnimatedStyle(() => ({ opacity: fade.value }));

  return (
    <Animated.View style={[styles.center, fadeStyle]} pointerEvents="none">
      <Animated.View style={[styles.thumbCircle, thumbStyle]}>
        <Icon name="thumbs-up" size={64} color="#FFFFFF" strokeWidth={2.4} />
      </Animated.View>
      <Animated.View style={[styles.textBlock, textStyle]}>
        <Text style={styles.title}>Félicitations !</Text>
        <Text style={styles.subtitle}>Vous avez accepté une course. Bonne route !</Text>
      </Animated.View>
    </Animated.View>
  );
}

function ConfettiLayer() {
  const particles = useMemo(makeParticles, []);
  const { height } = useWindowDimensions();
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p) => (
        <Particle key={p.id} spec={p} screenHeight={height} />
      ))}
    </View>
  );
}

function Particle({ spec, screenHeight }: { spec: ParticleSpec; screenHeight: number }) {
  // Chute : translateY de -10% a 110% de la hauteur ecran, rotate 0 -> 720deg, translateX 0 -> drift.
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      spec.delay,
      withSequence(
        withTiming(1, { duration: spec.duration, easing: Easing.in(Easing.ease) }),
        // Hold a 1 jusqu'au unmount par MissionAcceptedCelebration.
        withTiming(1, { duration: 0 }),
      ),
    );
    return () => cancelAnimation(progress);
  }, [progress, spec.delay, spec.duration]);

  const animatedStyle = useAnimatedStyle(() => {
    const startY = -screenHeight * 0.1;
    const endY = screenHeight * 1.1;
    const y = startY + (endY - startY) * progress.value;
    const x = spec.drift * progress.value;
    const rot = spec.rotation + 720 * progress.value;
    // Fade out sur les 20 derniers % (cohere avec le keyframe web).
    const opacity = progress.value < 0.8 ? 1 : Math.max(0, 1 - (progress.value - 0.8) / 0.2);
    return {
      opacity,
      transform: [{ translateY: y }, { translateX: x }, { rotate: `${rot}deg` }],
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: `${spec.x}%`,
          width: spec.size,
          height: spec.size,
          backgroundColor: spec.color,
          borderRadius: spec.shape === 'circle' ? spec.size / 2 : 2,
        },
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 12,
  },
  textBlock: {
    marginTop: 24,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFD11A',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
});
