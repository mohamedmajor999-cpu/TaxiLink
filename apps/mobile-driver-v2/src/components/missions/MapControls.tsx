import { Pressable, View } from 'react-native';

import { Icon } from '@/components/icons/Icon';
import { useTheme } from '@/lib/theme';

interface Props {
  iconsBottom: number;
  zoomBottom: number;
  visible: boolean;
  onLayers: () => void;
  onFullscreen: () => void;
  onLocate: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

// Contrôles map style PWA :
// - Zoom +/- bas-gauche, proche du sheet handle
// - Layers + Fullscreen bas-droite, mais nettement plus haut (au-dessus du
//   FAB "Poster une course")
export function MapControls({
  iconsBottom,
  zoomBottom,
  visible,
  onLayers,
  onFullscreen,
  onLocate,
  onZoomIn,
  onZoomOut,
}: Props) {
  const { colors, isDark } = useTheme();
  if (!visible) return null;
  const floatShadow = {
    shadowColor: '#000',
    shadowOpacity: isDark ? 0.55 : 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  };
  const chipBg = colors.surfaceElevated;
  const chipInk = colors.ink;
  const chipBorder = isDark ? { borderWidth: 1, borderColor: colors.border } : null;
  return (
    <>
      <View
        pointerEvents="box-none"
        style={{ position: 'absolute', left: 12, bottom: zoomBottom, alignItems: 'center' }}
      >
        <Pressable onPress={onZoomIn} style={{ marginBottom: 10 }}>
          <View
            style={{
              width: 44, height: 44, borderRadius: 22,
              backgroundColor: chipBg,
              alignItems: 'center', justifyContent: 'center',
              ...chipBorder,
              ...floatShadow,
            }}
          >
            <Icon name="plus" size={20} color={chipInk} strokeWidth={2.6} />
          </View>
        </Pressable>
        <Pressable onPress={onZoomOut}>
          <View
            style={{
              width: 44, height: 44, borderRadius: 22,
              backgroundColor: chipBg,
              alignItems: 'center', justifyContent: 'center',
              ...chipBorder,
              ...floatShadow,
            }}
          >
            <Icon name="minus" size={20} color={chipInk} strokeWidth={2.6} />
          </View>
        </Pressable>
      </View>

      <View
        pointerEvents="box-none"
        style={{ position: 'absolute', right: 12, bottom: iconsBottom, alignItems: 'center' }}
      >
        <Pressable onPress={onLayers} style={{ marginBottom: 10 }}>
          <View
            style={{
              width: 44, height: 44, borderRadius: 22,
              backgroundColor: chipBg,
              alignItems: 'center', justifyContent: 'center',
              ...chipBorder,
              ...floatShadow,
            }}
          >
            <Icon name="layers" size={20} color={chipInk} />
          </View>
        </Pressable>
        <Pressable onPress={onFullscreen} style={{ marginBottom: 10 }}>
          <View
            style={{
              width: 44, height: 44, borderRadius: 22,
              backgroundColor: chipBg,
              alignItems: 'center', justifyContent: 'center',
              ...chipBorder,
              ...floatShadow,
            }}
          >
            <Icon name="fullscreen" size={20} color={chipInk} />
          </View>
        </Pressable>
        <Pressable onPress={onLocate}>
          <View
            style={{
              width: 44, height: 44, borderRadius: 22,
              backgroundColor: chipBg,
              alignItems: 'center', justifyContent: 'center',
              ...chipBorder,
              ...floatShadow,
            }}
          >
            <Icon name="locate" size={20} color={chipInk} strokeWidth={2} />
          </View>
        </Pressable>
      </View>
    </>
  );
}
