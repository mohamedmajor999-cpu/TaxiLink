import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/icons/Icon';
import { useTheme } from '@/lib/theme';

interface Props {
  visible: boolean;
  bottomOffset: number;
  onPress: () => void;
}

export function PostCourseFab({ visible, bottomOffset, onPress }: Props) {
  const { colors, isDark } = useTheme();
  if (!visible) return null;
  // En dark : on bascule sur l'accent bleu Tesla pour une lecture immediate
  // ("CTA proeminent"). En light : on garde le noir #0F0F0F historique.
  const bg = isDark ? colors.accent : '#0F0F0F';
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute', left: 0, right: 0,
        bottom: bottomOffset,
        alignItems: 'center',
        zIndex: 50,
      }}
    >
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Poster une course">
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            height: 48,
            paddingHorizontal: 20,
            borderRadius: 24,
            backgroundColor: bg,
            shadowColor: '#000',
            shadowOpacity: isDark ? 0.6 : 0.32,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 10 },
            elevation: 8,
          }}
        >
          <View style={{ marginRight: 8 }}>
            <Icon name="plus" size={20} color="#FFFFFF" strokeWidth={2.6} />
          </View>
          <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>Poster une course</Text>
        </View>
      </Pressable>
    </View>
  );
}
