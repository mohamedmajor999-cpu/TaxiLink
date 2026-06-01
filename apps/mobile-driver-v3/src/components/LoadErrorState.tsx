import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/icons/Icon';
import { useTheme } from '@/lib/theme';

// RES-02 : etat d'ERREUR de chargement, distinct de l'etat VIDE. Sans lui, une
// coupure reseau affiche une liste vide → le chauffeur croit qu'il n'y a aucune
// course (perte de revenu sur l'onglet Disponibles). Toujours offrir "Reessayer".
export function LoadErrorState({ onRetry, message }: { onRetry: () => void; message?: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 }}>
      <Icon name="info" size={34} color={colors.inkSoft} strokeWidth={1.6} />
      <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink, textAlign: 'center' }}>
        Chargement impossible
      </Text>
      <Text style={{ fontSize: 13, color: colors.inkSoft, textAlign: 'center', lineHeight: 19 }}>
        {message ?? 'Vérifie ta connexion et réessaie.'}
      </Text>
      <View style={{ marginTop: 4, borderRadius: 12, backgroundColor: colors.brand, overflow: 'hidden' }}>
        <Pressable
          onPress={onRetry}
          android_ripple={{ color: 'rgba(0,0,0,0.12)' }}
          accessibilityRole="button"
          accessibilityLabel="Réessayer le chargement"
          style={{ paddingVertical: 12, paddingHorizontal: 28, alignItems: 'center' }}
        >
          <Text style={{ fontSize: 15, fontWeight: '800', color: colors.brandInk }}>Réessayer</Text>
        </Pressable>
      </View>
    </View>
  );
}
