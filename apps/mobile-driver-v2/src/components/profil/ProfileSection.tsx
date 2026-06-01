import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { useTheme } from '@/lib/theme';

interface Props {
  title: string;
  children: ReactNode;
}

export function ProfileSection({ title, children }: Props) {
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: 20 }}>
      <Text
        style={{
          fontSize: 11,
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: 1.5,
          color: colors.inkSoft,
          paddingHorizontal: 4,
          marginBottom: 8,
        }}
      >
        {title}
      </Text>
      <View style={{ gap: 8 }}>{children}</View>
    </View>
  );
}
