import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

interface Props {
  onEnter: () => void | Promise<void>;
}

export function OnboardingWelcome({ onEnter }: Props) {
  const insets = useSafeAreaInsets();

  async function go(target: '/register' | '/login') {
    try { await onEnter(); } catch { /* ignore */ }
    router.replace(target);
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF', paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 48 }}>
        <View
          style={{
            width: 112,
            height: 112,
            borderRadius: 28,
            backgroundColor: '#FFD11A',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOpacity: 0.18,
            shadowOffset: { width: 0, height: 10 },
            shadowRadius: 24,
            elevation: 8,
          }}
        >
          <Text style={{ color: '#000', fontSize: 56, fontWeight: '900', letterSpacing: -2 }}>T</Text>
        </View>

        <Text
          style={{
            marginTop: 28,
            fontSize: 38,
            fontWeight: '800',
            letterSpacing: -1.3,
            lineHeight: 42,
            textAlign: 'center',
            color: '#000',
          }}
        >
          Prêt à{' '}
          <Text
            style={{
              backgroundColor: '#FFD11A',
              paddingHorizontal: 8,
              borderRadius: 6,
            }}
          >
            rouler
          </Text>{' '}
          ?
        </Text>

        <Text
          style={{
            marginTop: 16,
            fontSize: 17,
            lineHeight: 25,
            color: '#5F5E5A',
            textAlign: 'center',
            maxWidth: 340,
          }}
        >
          Rejoignez les chauffeurs qui ont dit adieu à WhatsApp. Postez une course à la voix, un collègue l'attrape.
        </Text>

        <View style={{ marginTop: 32, gap: 14, alignSelf: 'center' }}>
          {['Inscription', 'Vérification', 'En route'].map((t, i) => (
            <View key={t} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 999,
                  backgroundColor: '#FFD11A',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#000', fontSize: 14, fontWeight: '900' }}>{i + 1}</Text>
              </View>
              <Text style={{ fontSize: 14, fontWeight: '800', letterSpacing: 1.4, textTransform: 'uppercase', color: '#000' }}>
                {t}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, paddingBottom: 24, gap: 12 }}>
        <Pressable
          onPress={() => go('/register')}
          android_ripple={{ color: 'rgba(255,255,255,0.18)' }}
          style={({ pressed }) => ({
            height: 60,
            borderRadius: 999,
            backgroundColor: '#000',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            opacity: pressed ? 0.92 : 1,
          })}
        >
          <Text style={{ color: '#FFF', fontSize: 17, fontWeight: '800', letterSpacing: -0.2 }}>Créer un compte</Text>
          <Arrow />
        </Pressable>

        <Pressable
          onPress={() => go('/login')}
          android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
          style={({ pressed }) => ({
            height: 60,
            borderRadius: 999,
            borderWidth: 2,
            borderColor: '#000',
            backgroundColor: '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.92 : 1,
          })}
        >
          <Text style={{ color: '#000', fontSize: 17, fontWeight: '700', letterSpacing: -0.2 }}>J'ai déjà un compte</Text>
        </Pressable>

        <Text
          style={{
            textAlign: 'center',
            fontSize: 12,
            color: '#888780',
            lineHeight: 18,
            paddingHorizontal: 16,
            marginTop: 6,
          }}
        >
          En continuant, vous acceptez nos <Text style={{ fontWeight: '700', color: '#000' }}>Conditions</Text> et notre{' '}
          <Text style={{ fontWeight: '700', color: '#000' }}>Politique de confidentialité</Text>. Données hébergées en France 🇫🇷
        </Text>
      </View>
    </View>
  );
}

function Arrow() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h14M13 6l6 6-6 6" stroke="#FFF" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
