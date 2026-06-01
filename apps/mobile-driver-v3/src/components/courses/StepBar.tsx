import { Text, View } from 'react-native';

import { useTheme } from '@/lib/theme';

export type ProgressStep = 'available' | 'accepted' | 'enroute' | 'onboard' | 'dropped' | 'done';

const STEPS: { key: ProgressStep; label: string }[] = [
  { key: 'accepted', label: 'Acceptée' },
  { key: 'enroute', label: 'En route' },
  { key: 'onboard', label: 'À bord' },
  { key: 'dropped', label: 'Déposé' },
];

const PROGRESS_TO_INDEX: Record<ProgressStep, number> = {
  available: 0, accepted: 0, enroute: 1, onboard: 2, dropped: 3, done: 3,
};

// 4 segments horizontaux (3px haut) avec labels uppercase en dessous.
// Réplique PWA StepBar.tsx — segment actif jaune brand, segments passés noir, futur warm-200.
export function StepBar({ progress }: { progress: ProgressStep }) {
  const { colors, isDark } = useTheme();
  const idx = PROGRESS_TO_INDEX[progress];
  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 3 }}>
        {STEPS.map((_, i) => {
          const isDone = i < idx || progress === 'done';
          const isCurrent = i === idx && progress !== 'done';
          const bg = isDone ? (isDark ? colors.accent : '#0F0F0F') : isCurrent ? colors.brand : colors.border;
          return <View key={i} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: bg }} />;
        })}
      </View>
      <View style={{ flexDirection: 'row', gap: 3, marginTop: 8 }}>
        {STEPS.map((s, i) => {
          const isDone = i < idx || progress === 'done';
          const isCurrent = i === idx && progress !== 'done';
          const color = isCurrent ? colors.ink : isDone ? colors.inkMuted : colors.inkSoft;
          return (
            <Text
              key={s.key}
              numberOfLines={1}
              style={{
                flex: 1,
                fontSize: 9.5,
                fontWeight: '800',
                letterSpacing: 0.6,
                color,
              }}
            >
              {s.label.toUpperCase()}
            </Text>
          );
        })}
      </View>
    </View>
  );
}
