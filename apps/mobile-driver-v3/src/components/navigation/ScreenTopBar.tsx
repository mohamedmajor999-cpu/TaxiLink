import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { useTheme } from '@/lib/theme';

interface Props {
  /** Titre affiche au centre / gauche du header. */
  title?: string;
  /** Bouton(s) optionnel(s) a droite (ex: back, action). */
  rightSlot?: ReactNode;
}

// Top bar minimal pour les ecrans qui ne sont pas la home. Remplace
// l'ancien `ScreenHamburgerHeader` (V6) : la BottomNav v3 etant permanente,
// le hamburger fait double emploi avec elle. Ce composant garde uniquement
// titre + slot droit (typiquement un bouton retour ou une action).
export function ScreenTopBar({ title, rightSlot }: Props) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.surface,
      }}
    >
      {title ? (
        <Text
          numberOfLines={1}
          style={{ flex: 1, fontSize: 17, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 }}
        >
          {title}
        </Text>
      ) : (
        <View style={{ flex: 1 }} />
      )}
      {rightSlot}
    </View>
  );
}
