import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/icons/Icon';
import { useTheme } from '@/lib/theme';

/**
 * Bandeau d'enregistrement audio affiché en haut de la page Poster une course
 * dès qu'un mic est actif (gros mic ou mic par champ). Compact, rouge, avec
 * bouton X pour stopper. Sticky en haut sans pousser le contenu.
 */
export function VoiceRecordingBanner({ visible, onStop }: { visible: boolean; onStop: () => void }) {
  const { colors, isDark } = useTheme();
  if (!visible) return null;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginHorizontal: 16,
        marginBottom: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 14,
        backgroundColor: colors.dangerSoft,
        borderWidth: 1,
        borderColor: colors.danger,
      }}
    >
      <View style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: colors.danger }} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 12.5, fontWeight: '800', color: colors.danger, letterSpacing: 0.4 }}>
          J'ÉCOUTE…
        </Text>
        <Text numberOfLines={1} style={{ fontSize: 12, color: colors.danger, marginTop: 1 }}>
          Parlez maintenant, puis touchez pour arrêter.
        </Text>
      </View>
      <View style={{ width: 34, height: 34, borderRadius: 17, overflow: 'hidden' }}>
        <Pressable
          onPress={onStop}
          accessibilityLabel="Arrêter la dictée"
          android_ripple={{ color: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(220,38,38,0.15)' }}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="x" size={18} color={colors.danger} strokeWidth={2.6} />
        </Pressable>
      </View>
    </View>
  );
}
