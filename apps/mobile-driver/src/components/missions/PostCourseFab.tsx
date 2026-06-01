import { Pressable, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface Props {
  onPress: () => void
  bottom: number
}

// FAB carre (radius 18px, pas rond) pour rester dans le langage TaxiLink
// (rounded 2xl, pas le FAB Material standard). Position absolue bottom-center.
export function PostCourseFab({ onPress, bottom }: Props) {
  return (
    <View
      pointerEvents="box-none"
      className="absolute left-0 right-0 items-center"
      style={{ bottom }}
    >
      <Pressable
        onPress={onPress}
        className="flex-row items-center bg-ink"
        style={{
          paddingHorizontal: 20,
          paddingVertical: 14,
          gap: 8,
          borderRadius: 18,
          shadowColor: '#000',
          shadowOpacity: 0.25,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          elevation: 8,
        }}
      >
        <Ionicons name="add" size={20} color="#FFD23F" />
        <Text className="text-paper font-sans-extrabold text-sm">Poster une course</Text>
      </Pressable>
    </View>
  )
}
