import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { useDriverCount } from './useDriverCount';

interface Props {
  onEnter: () => void | Promise<void>;
}

const STEPS = [
  { title: 'Inscription', subtitle: '2 minutes chrono' },
  { title: 'Vérification ADS', subtitle: 'Photo carte pro' },
  { title: 'Première course', subtitle: 'En route' },
] as const;

export function OnboardingWelcome({ onEnter }: Props) {
  const insets = useSafeAreaInsets();
  const driverCount = useDriverCount('13');
  // Samsung One UI + nav gestuelle + edge-to-edge : insets.bottom = 0 alors
  // que la gesture hint bar fait ~48dp. Floor 24dp pour garantir que les
  // boutons sticky ne sont pas masques par l'OS. Cf. safe-area-context #663.
  const safeBottom = Math.max(insets.bottom, 24);

  async function go(target: '/register' | '/login') {
    try { await onEnter(); } catch { /* ignore */ }
    router.replace(target);
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF', paddingTop: insets.top }}>
      {/* Haut scrollable (logo + titre + social proof + lead + 3 checkpoints).
          Sans ScrollView, sur Samsung ecrans courts ou avec font scale > 130%,
          les 3 Checkpoints poussaient les boutons "Creer mon compte" / "J'ai
          deja un compte" hors de l'ecran (rapporte 2026-05-24). */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 32, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 22,
            backgroundColor: '#FFD11A',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOpacity: 0.18,
            shadowOffset: { width: 0, height: 8 },
            shadowRadius: 18,
            elevation: 6,
          }}
        >
          <Text style={{ color: '#000', fontSize: 42, fontWeight: '900', letterSpacing: -2 }}>T</Text>
        </View>

        <Text
          style={{
            marginTop: 18,
            fontSize: 32,
            fontWeight: '800',
            letterSpacing: -1.1,
            lineHeight: 36,
            textAlign: 'center',
            color: '#000',
          }}
        >
          Prêt à{' '}
          <Text style={{ backgroundColor: '#FFD11A', paddingHorizontal: 6, borderRadius: 6 }}>
            rouler
          </Text>{' '}
          ?
        </Text>

        <SocialProof count={driverCount} />

        <Text
          style={{
            marginTop: 12,
            fontSize: 14,
            lineHeight: 20,
            color: '#5F5E5A',
            textAlign: 'center',
            maxWidth: 320,
          }}
        >
          Ils ont dit adieu à WhatsApp. Postez une course à la voix, un collègue l'attrape.
        </Text>

        <View style={{ marginTop: 20, gap: 10, alignSelf: 'stretch' }}>
          {STEPS.map((s) => <Checkpoint key={s.title} title={s.title} subtitle={s.subtitle} />)}
        </View>
      </ScrollView>

      {/* Boutons sticky en bas, jamais clippes. Layout robuste : width 100%
          explicite + alignItems center du Text dans Pressable + ombre forte
          pour separer du fond blanc. Demande user 2026-05-25 (bouton noir
          invisible + lien deja un compte mal centre). */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: safeBottom + 10,
          gap: 12,
          backgroundColor: '#FFFFFF',
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowOffset: { width: 0, height: -4 },
          shadowRadius: 8,
          elevation: 12,
        }}
      >
        <Pressable
          onPress={() => go('/register')}
          android_ripple={{ color: 'rgba(255,255,255,0.18)' }}
          style={({ pressed }) => ({
            width: '100%',
            height: 60,
            borderRadius: 999,
            backgroundColor: '#000000',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            opacity: pressed ? 0.9 : 1,
            shadowColor: '#000',
            shadowOpacity: 0.28,
            shadowOffset: { width: 0, height: 8 },
            shadowRadius: 14,
            elevation: 8,
          })}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '800', letterSpacing: -0.2, textAlign: 'center' }}>
            Créer mon compte
          </Text>
          <Arrow />
        </Pressable>

        <Pressable
          onPress={() => go('/login')}
          android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
          style={({ pressed }) => ({
            width: '100%',
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Text style={{ color: '#000000', fontSize: 15, fontWeight: '700', textAlign: 'center', textDecorationLine: 'underline' }}>
            J'ai déjà un compte
          </Text>
        </Pressable>

        <Text
          style={{
            textAlign: 'center',
            fontSize: 11,
            color: '#9CA3AF',
            lineHeight: 16,
            paddingHorizontal: 16,
          }}
        >
          En continuant, vous acceptez les <Text style={{ fontWeight: '700', color: '#374151' }}>Conditions</Text> et la{' '}
          <Text style={{ fontWeight: '700', color: '#374151' }}>Politique</Text>. Données en France 🇫🇷
        </Text>
      </View>
    </View>
  );
}

function SocialProof({ count }: { count: number }) {
  return (
    <View
      style={{
        marginTop: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 999,
        backgroundColor: '#FAFAF9',
        borderWidth: 1,
        borderColor: '#F3F4F6',
      }}
    >
      <View style={{ flexDirection: 'row' }}>
        <View style={{ width: 18, height: 18, borderRadius: 999, backgroundColor: '#FCD34D', borderWidth: 2, borderColor: '#FFF' }} />
        <View style={{ width: 18, height: 18, borderRadius: 999, backgroundColor: '#FB923C', borderWidth: 2, borderColor: '#FFF', marginLeft: -6 }} />
        <View style={{ width: 18, height: 18, borderRadius: 999, backgroundColor: '#FDA4AF', borderWidth: 2, borderColor: '#FFF', marginLeft: -6 }} />
      </View>
      <Text style={{ fontSize: 12, color: '#374151', fontWeight: '600' }}>
        <Text style={{ fontWeight: '800', color: '#000' }}>{count}</Text> chauffeurs à Marseille
      </Text>
    </View>
  );
}

function Checkpoint({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 14,
        backgroundColor: '#ECFDF5',
        borderWidth: 1,
        borderColor: '#D1FAE5',
      }}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 999,
          backgroundColor: '#10B981',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
          <Path d="M20 6L9 17l-5-5" stroke="#FFF" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: '800', color: '#064E3B' }}>{title}</Text>
        <Text style={{ fontSize: 11, color: '#047857', marginTop: 1 }}>{subtitle}</Text>
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
