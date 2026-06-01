import { Image, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  onNext: () => void;
}

export function OnboardingSplash({ onNext }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#FFD11A',
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View style={{ alignItems: 'center', gap: 20 }}>
        <View
          style={{
            width: 128,
            height: 128,
            borderRadius: 32,
            backgroundColor: '#000',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#FFD11A', fontSize: 64, fontWeight: '900', letterSpacing: -2 }}>T</Text>
        </View>
        <Image
          source={require('../../../assets/brand/logo-email.png')}
          style={{ width: 260, height: 52, resizeMode: 'contain' }}
        />
        <Text style={{ color: 'rgba(0,0,0,0.85)', fontSize: 17, fontWeight: '700', letterSpacing: -0.2 }}>
          Partagez vos courses. Gagnez plus.
        </Text>
      </View>

      <Pressable
        onPress={onNext}
        style={({ pressed }) => ({
          position: 'absolute',
          left: 24,
          right: 24,
          bottom: insets.bottom + 80,
          height: 60,
          borderRadius: 18,
          backgroundColor: '#000',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.85 : 1,
        })}
        android_ripple={{ color: 'rgba(255,255,255,0.15)' }}
      >
        <Text style={{ color: '#FFF', fontSize: 17, fontWeight: '700', letterSpacing: -0.2 }}>Suivant</Text>
      </Pressable>

      <Text
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: insets.bottom + 32,
          textAlign: 'center',
          color: 'rgba(0,0,0,0.55)',
          fontSize: 11,
          fontWeight: '800',
          letterSpacing: 2.6,
          textTransform: 'uppercase',
        }}
      >
        Built by drivers · for drivers
      </Text>
    </View>
  );
}
