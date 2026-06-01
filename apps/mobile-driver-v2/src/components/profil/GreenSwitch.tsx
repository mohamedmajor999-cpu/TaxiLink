import { useEffect, useRef } from 'react';
import { Animated, Pressable, View } from 'react-native';

import { useTheme } from '@/lib/theme';

interface Props {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}

const TRACK_WIDTH = 44;
const TRACK_HEIGHT = 26;
const KNOB_SIZE = 22;
const PADDING = (TRACK_HEIGHT - KNOB_SIZE) / 2;

export function GreenSwitch({ checked, onChange, disabled, accessibilityLabel }: Props) {
  const { colors, isDark } = useTheme();
  const anim = useRef(new Animated.Value(checked ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: checked ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [checked, anim]);

  const trackColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [isDark ? colors.border : '#D3D1C7', colors.success],
  });
  const knobX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [PADDING, TRACK_WIDTH - KNOB_SIZE - PADDING],
  });

  return (
    <Pressable
      onPress={() => !disabled && onChange(!checked)}
      accessibilityRole="switch"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={accessibilityLabel}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <Animated.View
        style={{
          width: TRACK_WIDTH,
          height: TRACK_HEIGHT,
          borderRadius: TRACK_HEIGHT / 2,
          backgroundColor: trackColor,
          justifyContent: 'center',
        }}
      >
        <Animated.View
          style={{
            position: 'absolute',
            left: knobX,
            width: KNOB_SIZE,
            height: KNOB_SIZE,
            borderRadius: KNOB_SIZE / 2,
            backgroundColor: '#FFFFFF',
            shadowColor: '#000',
            shadowOpacity: 0.18,
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 2,
            elevation: 2,
          }}
        />
        {/* Pour Android la shadow visible, ajout d'une bordure très fine */}
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderRadius: TRACK_HEIGHT / 2 }} />
      </Animated.View>
    </Pressable>
  );
}
