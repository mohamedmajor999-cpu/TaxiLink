import { ActivityIndicator, Modal, Text, View } from 'react-native';

import { useTheme } from '@/lib/theme';

/**
 * Overlay plein écran affiché pendant l'analyse Whisper + GPT (5-10s) après
 * arrêt du gros mic ou d'un mic par champ. Fond dimmed + card noire centrée
 * avec spinner jaune. Bloque l'interaction pour éviter les actions concurrentes.
 */
export function VoiceProcessingModal({ visible }: { visible: boolean }) {
  const { colors, isDark } = useTheme();
  // Backdrop : noir semi-transparent dans les deux modes (plus marqué en dark
  // pour bien isoler le modal du fond gris-bleu).
  const backdropColor = isDark ? 'rgba(0,0,0,0.65)' : 'rgba(0,0,0,0.45)';
  // Card centrale : noir plein en light, surfaceElevated en dark pour rester
  // dans la palette Tesla Driver Display.
  const cardBg = isDark ? colors.surfaceElevated : '#0F0F0F';
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View
        style={{
          flex: 1,
          backgroundColor: backdropColor,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 32,
        }}
      >
        <View
          style={{
            backgroundColor: cardBg,
            borderWidth: isDark ? 1 : 0,
            borderColor: colors.border,
            paddingHorizontal: 36,
            paddingVertical: 32,
            borderRadius: 24,
            alignItems: 'center',
            minWidth: 280,
            maxWidth: 360,
          }}
        >
          <ActivityIndicator size="large" color={colors.brand} />
          <Text style={{ marginTop: 18, fontSize: 17, fontWeight: '800', color: '#FFFFFF', textAlign: 'center', letterSpacing: -0.2 }}>
            L'IA remplit les champs…
          </Text>
          <Text style={{ marginTop: 8, fontSize: 13, fontWeight: '500', color: isDark ? colors.inkMuted : '#B5B2A8', textAlign: 'center', lineHeight: 18 }}>
            Cela prend 5 à 10 secondes — patientez
          </Text>
        </View>
      </View>
    </Modal>
  );
}
