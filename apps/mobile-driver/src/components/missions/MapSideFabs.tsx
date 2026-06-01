import { Alert, Pressable, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface Props {
  bottom: number
  isDark: boolean
  onLocate: () => void
  onExpand: () => void
}

// Boutons flottants bottom-right de la carte (style PWA) :
// - Locate : pan la carte sur la position du chauffeur (Ma position)
// - Layers : bascule satellite/standard (placeholder, branche en Sem 11)
// - Expand : ferme le bottom sheet pour donner la carte plein ecran
export function MapSideFabs({ bottom, isDark, onLocate, onExpand }: Props) {
  const shadow = {
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  }
  const iconColor = isDark ? '#E5E2DA' : '#1A1A1A'
  return (
    <View
      pointerEvents="box-none"
      className="absolute right-3"
      style={{ bottom, gap: 8 }}
    >
      <Pressable
        onPress={onLocate}
        className="bg-paper dark:bg-night-surface rounded-full w-11 h-11 items-center justify-center"
        style={shadow}
        hitSlop={6}
      >
        <Ionicons name="locate" size={20} color={iconColor} />
      </Pressable>
      <Pressable
        onPress={() => Alert.alert('Bientot dispo', 'La bascule satellite/standard arrive bientot.')}
        className="bg-paper dark:bg-night-surface rounded-full w-11 h-11 items-center justify-center"
        style={shadow}
        hitSlop={6}
      >
        <Ionicons name="layers-outline" size={20} color={iconColor} />
      </Pressable>
      <Pressable
        onPress={onExpand}
        className="bg-paper dark:bg-night-surface rounded-full w-11 h-11 items-center justify-center"
        style={shadow}
        hitSlop={6}
      >
        <Ionicons name="expand-outline" size={20} color={iconColor} />
      </Pressable>
    </View>
  )
}
