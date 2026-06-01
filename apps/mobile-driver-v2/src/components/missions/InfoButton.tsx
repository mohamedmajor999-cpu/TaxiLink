import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '@/lib/theme';

interface Props {
  bottom: number;
  attribution: string;
}

// Bouton "i" rond positionné dans la colonne droite (alignée avec Locate),
// SOUS la pile Layers/Fullscreen/Locate. Tap → la pulse d'attribution
// s'affiche au-dessus du bouton (dans la même colonne).
export function InfoButton({ bottom, attribution }: Props) {
  const { colors, isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const btnBg = isDark ? colors.surfaceElevated : '#0F0F0F';
  const btnInk = isDark ? colors.ink : '#FFFFFF';
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        right: 12 + (44 - 26) / 2,
        bottom,
        flexDirection: 'row-reverse',
        alignItems: 'center',
      }}
    >
      <Pressable onPress={() => setOpen((v) => !v)} accessibilityRole="button" accessibilityLabel="Crédits carte">
        <View
          style={{
            width: 26,
            height: 26,
            borderRadius: 13,
            backgroundColor: btnBg,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: isDark ? 1 : 0,
            borderColor: colors.border,
            shadowColor: '#000',
            shadowOpacity: isDark ? 0.5 : 0.25,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
            elevation: 3,
          }}
        >
          <Text
            style={{
              color: btnInk,
              fontSize: 16, fontWeight: '700', lineHeight: 18,
              includeFontPadding: false, textAlign: 'center',
            }}
          >
            i
          </Text>
        </View>
      </Pressable>

      {open && (
        <View
          style={{
            marginRight: 8,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 12,
            backgroundColor: isDark ? 'rgba(31,34,40,0.95)' : 'rgba(255,255,255,0.95)',
            borderWidth: isDark ? 1 : 0,
            borderColor: colors.border,
            shadowColor: '#000',
            shadowOpacity: isDark ? 0.4 : 0.15,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
            elevation: 3,
          }}
        >
          <Text style={{ fontSize: 10.5, fontWeight: '500', color: colors.ink }}>{attribution}</Text>
        </View>
      )}
    </View>
  );
}
