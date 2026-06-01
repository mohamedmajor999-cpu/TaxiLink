import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

// Mockup d'une vraie carte de course avec barre de progression long-press
// animee + indicateur doigt. Plus credible que l'ancienne illustration
// hand-drawn voiture+phone.
export function SlideIlloLongPress() {
  const progress = useSharedValue(0);
  const finger = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 300 }),
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 500 }),
      ),
      -1,
      false,
    );
    finger.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 300 }),
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 500 }),
      ),
      -1,
      false,
    );
  }, [progress, finger]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const fingerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: finger.value * -3 },
      { scale: 1 - finger.value * 0.06 },
    ],
  }));

  return (
    <View style={{ width: '100%', alignItems: 'center' }}>
      <View
        style={{
          width: '100%',
          maxWidth: 320,
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          borderWidth: 1,
          borderColor: '#E8E6DF',
          padding: 16,
          shadowColor: '#000',
          shadowOpacity: 0.12,
          shadowOffset: { width: 0, height: 12 },
          shadowRadius: 24,
          elevation: 6,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={{ fontSize: 10, fontWeight: '800', color: '#9CA3AF', letterSpacing: 1 }}>
              DANS 12 MIN
            </Text>
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#000', marginTop: 4 }} numberOfLines={1}>
              Aéroport Marignane
            </Text>
            <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }} numberOfLines={1}>
              ↓ Vieux-Port, Marseille
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: '#000' }}>42€</Text>
            <Text style={{ fontSize: 10, color: '#9CA3AF' }}>28 km</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 6, marginTop: 12 }}>
          <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 }}>
            <Text style={{ fontSize: 10, fontWeight: '800', color: '#92400E' }}>CB ACCEPTÉE</Text>
          </View>
          <View style={{ backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 }}>
            <Text style={{ fontSize: 10, fontWeight: '800', color: '#4B5563' }}>4 PAX</Text>
          </View>
        </View>

        <View
          style={{
            marginTop: 16,
            height: 44,
            borderRadius: 12,
            backgroundColor: '#000',
            overflow: 'hidden',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                backgroundColor: '#FFD11A',
              },
              fillStyle,
            ]}
          />
          <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '800', letterSpacing: 0.2 }}>
            Maintenez pour prendre…
          </Text>
        </View>
      </View>

      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: -14,
            right: 36,
            width: 40,
            height: 40,
            borderRadius: 999,
            backgroundColor: '#1F2937',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOpacity: 0.3,
            shadowOffset: { width: 0, height: 6 },
            shadowRadius: 12,
            elevation: 8,
          },
          fingerStyle,
        ]}
      >
        <Text style={{ fontSize: 22 }}>👆</Text>
      </Animated.View>
    </View>
  );
}
