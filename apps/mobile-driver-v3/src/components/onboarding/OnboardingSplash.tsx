import { Image, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

interface Props {
  onNext: () => void;
}

// Splash jaune d'entree : logo + tagline + bouton "Suivant" qui lance le
// carousel. Refonte 2026-05-25 :
//  - Bouton "Suivant" en layout FLEX (pas absolute) → toujours visible, marges
//    propres au bas de l'ecran. Avant : position absolute bottom 80 + 32 →
//    sur certains Samsung One UI le bg noir ne s'affichait pas (couches GPU
//    OEM), texte blanc devenait invisible sur fond jaune.
//  - Bordure + ombre forte pour separer visuellement du fond jaune.
//  - Icone fleche pour CTA explicite.
export function OnboardingSplash({ onNext }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#FFD11A',
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      {/* Contenu centre verticalement */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
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
          style={{ width: 260, height: 52, resizeMode: 'contain', marginTop: 20 }}
        />
        <Text style={{ color: 'rgba(0,0,0,0.85)', fontSize: 17, fontWeight: '700', letterSpacing: -0.2, marginTop: 16, textAlign: 'center' }}>
          Partagez vos courses. Gagnez plus.
        </Text>
      </View>

      {/* Bouton + tagline en bas, layout flex (pas absolute) pour eviter tout
          probleme de superposition sur OEM. */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 28, gap: 18, alignItems: 'center' }}>
        <Pressable
          onPress={onNext}
          android_ripple={{ color: 'rgba(255,255,255,0.18)' }}
          style={({ pressed }) => ({
            width: '100%',
            height: 60,
            borderRadius: 18,
            backgroundColor: '#000',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            opacity: pressed ? 0.88 : 1,
            // Bordure jaune brand pour decoller visuellement du fond jaune.
            borderWidth: 3,
            borderColor: 'rgba(0,0,0,0.18)',
            shadowColor: '#000',
            shadowOpacity: 0.28,
            shadowOffset: { width: 0, height: 8 },
            shadowRadius: 14,
            elevation: 8,
          })}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '800', letterSpacing: -0.2, textAlign: 'center' }}>
            Suivant
          </Text>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path d="M5 12h14M13 6l6 6-6 6" stroke="#FFFFFF" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Pressable>

        <Text
          style={{
            color: 'rgba(0,0,0,0.55)',
            fontSize: 11,
            fontWeight: '800',
            letterSpacing: 2.6,
            textTransform: 'uppercase',
            textAlign: 'center',
          }}
        >
          Built by drivers · for drivers
        </Text>
      </View>
    </View>
  );
}
