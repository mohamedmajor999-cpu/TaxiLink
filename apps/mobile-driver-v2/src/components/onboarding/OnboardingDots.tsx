import { View } from 'react-native';

interface Props {
  total: number;
  active: number;
  variant?: 'light' | 'dark';
}

export function OnboardingDots({ total, active, variant = 'light' }: Props) {
  const baseColor = variant === 'dark' ? 'rgba(255,255,255,0.22)' : '#E8E6DF';
  const onColor = variant === 'dark' ? '#FFD11A' : '#000000';

  return (
    <View className="flex-row justify-center" style={{ gap: 10 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            height: 9,
            width: i === active ? 32 : 9,
            borderRadius: 999,
            backgroundColor: i === active ? onColor : baseColor,
          }}
        />
      ))}
    </View>
  );
}
