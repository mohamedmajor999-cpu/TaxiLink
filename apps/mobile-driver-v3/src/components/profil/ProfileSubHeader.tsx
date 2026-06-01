import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Icon } from '@/components/icons/Icon';
import { useTheme } from '@/lib/theme';

interface Props {
  title: string;
  subtitle?: string;
}

export function ProfileSubHeader({ title, subtitle }: Props) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.bg,
      }}
    >
      <Pressable
        onPress={() => router.back()}
        accessibilityLabel="Retour"
        style={{
          width: 40,
          height: 40,
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="arrow-left" size={22} color={colors.ink} strokeWidth={2.2} />
      </Pressable>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ fontSize: 18, fontWeight: '800', color: colors.ink }}>
          {title}
        </Text>
        {subtitle && (
          <Text numberOfLines={1} style={{ fontSize: 12.5, color: colors.inkSoft, marginTop: 1 }}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );
}
