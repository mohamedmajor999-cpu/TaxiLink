import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { useBackgroundLocationPromptStore } from '@/lib/backgroundLocationPromptStore';

// Modal plein ecran qui prepare le chauffeur AVANT que l'OS Android n'ouvre
// son ecran de parametres de localisation. L'ecran systeme ne ressemble pas
// au dialogue de permission classique : pas de bouton "OK", un simple tap sur
// l'option valide. Sans cette explication, les chauffeurs prennent souvent
// "Lorsque l'app est utilisee" qui casse le tracking GPS background.
export function BackgroundLocationPrompt() {
  const isVisible = useBackgroundLocationPromptStore((s) => s.isVisible);
  const resolve = useBackgroundLocationPromptStore((s) => s.resolve);
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={isVisible} animationType="slide" presentationStyle="overFullScreen" transparent>
      <View
        style={{
          flex: 1,
          backgroundColor: '#FFFFFF',
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom,
        }}
      >
        <View style={{ paddingHorizontal: 20, paddingBottom: 12, alignItems: 'flex-end' }}>
          <Pressable
            onPress={() => resolve(false)}
            hitSlop={16}
            android_ripple={{ color: 'rgba(0,0,0,0.08)', borderless: true }}
            style={({ pressed }) => ({
              width: 36, height: 36, borderRadius: 999,
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: '#F4F4F5',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path d="M18 6L6 18M6 6l12 12" stroke="#000" strokeWidth={2.5} strokeLinecap="round" />
            </Svg>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{
              width: 56, height: 56, borderRadius: 16, backgroundColor: '#FFD11A',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
              <Path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z" stroke="#000" strokeWidth={2.4} strokeLinejoin="round" />
              <Circle cx={12} cy={9} r={2.5} stroke="#000" strokeWidth={2.4} />
            </Svg>
          </View>

          <Text style={{ marginTop: 14, fontSize: 26, fontWeight: '800', color: '#000', letterSpacing: -0.7, lineHeight: 32 }}>
            Active le GPS{'\n'}en arrière-plan
          </Text>

          <Text style={{ marginTop: 8, fontSize: 14, color: '#6B7280', lineHeight: 20 }}>
            Android va t'ouvrir un écran système. Voici exactement quoi faire :
          </Text>

          <AndroidScreenMockup />

          <View style={{ marginTop: 18, gap: 10 }}>
            <Step n={1} text="Tape sur « Toujours autoriser »" emphasis="Toujours autoriser" />
            <Step n={2} text="Reviens dans l'app avec la flèche ◀" />
          </View>

          <View
            style={{
              marginTop: 16,
              flexDirection: 'row',
              gap: 10,
              padding: 12,
              borderRadius: 12,
              backgroundColor: '#FEF3C7',
              borderWidth: 1,
              borderColor: '#FDE68A',
            }}
          >
            <Text style={{ fontSize: 16 }}>⚠️</Text>
            <Text style={{ flex: 1, fontSize: 12, color: '#92400E', lineHeight: 17 }}>
              <Text style={{ fontWeight: '800' }}>Pas de bouton OK.</Text> Le simple fait de taper sur l'option valide ton choix.
            </Text>
          </View>
        </ScrollView>

        <View style={{ paddingHorizontal: 20, paddingTop: 8, gap: 8 }}>
          <Pressable
            onPress={() => resolve(true)}
            android_ripple={{ color: 'rgba(255,255,255,0.18)' }}
            style={({ pressed }) => ({
              height: 58,
              borderRadius: 999,
              backgroundColor: '#000',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              opacity: pressed ? 0.92 : 1,
              shadowColor: '#000',
              shadowOpacity: 0.18,
              shadowOffset: { width: 0, height: 6 },
              shadowRadius: 14,
              elevation: 4,
            })}
          >
            <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: -0.2 }}>
              J'ai compris, ouvrir Android
            </Text>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path d="M5 12h14M13 6l6 6-6 6" stroke="#FFF" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Pressable>

          <Pressable
            onPress={() => resolve(false)}
            android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
            style={({ pressed }) => ({
              height: 40, alignItems: 'center', justifyContent: 'center',
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '700' }}>Plus tard</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function AndroidScreenMockup() {
  return (
    <View
      style={{
        marginTop: 16,
        padding: 14,
        borderRadius: 18,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
      }}
    >
      <Text style={{ fontSize: 11, fontWeight: '800', color: '#94A3B8', letterSpacing: 1, marginBottom: 10 }}>
        APERÇU ANDROID
      </Text>
      <Option label="Toujours autoriser" highlight />
      <Option label="Lorsque l'appli est utilisée" />
      <Option label="Toujours demander" />
      <Option label="Ne pas autoriser" />
    </View>
  );
}

function Option({ label, highlight }: { label: string; highlight?: boolean }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderRadius: 10,
        backgroundColor: highlight ? '#FEF3C7' : 'transparent',
        borderWidth: highlight ? 2 : 0,
        borderColor: highlight ? '#FFD11A' : 'transparent',
        marginBottom: 4,
      }}
    >
      <View
        style={{
          width: 18, height: 18, borderRadius: 999,
          borderWidth: 2,
          borderColor: highlight ? '#000' : '#CBD5E1',
          backgroundColor: highlight ? '#000' : 'transparent',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        {highlight ? <View style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: '#FFF' }} /> : null}
      </View>
      <Text style={{ flex: 1, fontSize: 14, fontWeight: highlight ? '800' : '500', color: highlight ? '#000' : '#475569' }}>
        {label}
      </Text>
      {highlight ? (
        <View style={{ backgroundColor: '#000', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 }}>
          <Text style={{ color: '#FFD11A', fontSize: 9, fontWeight: '900', letterSpacing: 0.8 }}>CHOISIS ÇA</Text>
        </View>
      ) : null}
    </View>
  );
}

function Step({ n, text, emphasis }: { n: number; text: string; emphasis?: string }) {
  const parts = emphasis ? text.split(emphasis) : null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
      <View
        style={{
          width: 24, height: 24, borderRadius: 999,
          backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', marginTop: 1,
        }}
      >
        <Text style={{ color: '#FFD11A', fontSize: 12, fontWeight: '900' }}>{n}</Text>
      </View>
      <Text style={{ flex: 1, fontSize: 14, color: '#111827', lineHeight: 20 }}>
        {parts ? (
          <>
            {parts[0]}
            <Text style={{ fontWeight: '800', backgroundColor: '#FEF3C7' }}>{emphasis}</Text>
            {parts[1]}
          </>
        ) : (
          text
        )}
      </Text>
    </View>
  );
}
