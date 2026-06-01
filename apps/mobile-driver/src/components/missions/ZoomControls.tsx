import { Pressable, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface Props {
  onZoomIn: () => void
  onZoomOut: () => void
  bottom: number
}

// Boutons +/- empiles bottom-left. Convention mobile (Uber, Google Maps).
// Le pinch-zoom natif fonctionne deja, ces boutons sont une aide.
export function ZoomControls({ onZoomIn, onZoomOut, bottom }: Props) {
  return (
    <View
      pointerEvents="box-none"
      className="absolute left-3"
      style={{ bottom, gap: 4 }}
    >
      <Pressable
        onPress={onZoomIn}
        className="w-11 h-11 bg-paper dark:bg-night-surface rounded-full items-center justify-center"
        style={{
          shadowColor: '#000',
          shadowOpacity: 0.12,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
          elevation: 4,
        }}
        hitSlop={6}
      >
        <Ionicons name="add" size={22} color="#1A1A1A" />
      </Pressable>
      <Pressable
        onPress={onZoomOut}
        className="w-11 h-11 bg-paper dark:bg-night-surface rounded-full items-center justify-center"
        style={{
          shadowColor: '#000',
          shadowOpacity: 0.12,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
          elevation: 4,
        }}
        hitSlop={6}
      >
        <Ionicons name="remove" size={22} color="#1A1A1A" />
      </Pressable>
    </View>
  )
}
