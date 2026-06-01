import { Pressable, ScrollView, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

export type MissionFilter = 'all' | 'CPAM' | 'PRIVE' | 'urgent' | 'near'

interface Props {
  filter: MissionFilter
  setFilter: (f: MissionFilter) => void
  counts: Record<MissionFilter, number>
}

// Barre de chips au-dessus du bottom sheet. Tap = activer le filtre.
// "Tout" + 3 specifiques (CPAM, PRIVE, urgent) + 1 contextuel (<5km du chauffeur).
export function FilterChips({ filter, setFilter, counts }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 12, gap: 8, alignItems: 'center' }}
      style={{ flexGrow: 0 }}
    >
      <Chip label="Tout" active={filter === 'all'} count={counts.all} onPress={() => setFilter('all')} />
      <Chip label="Medical" active={filter === 'CPAM'} count={counts.CPAM} onPress={() => setFilter('CPAM')} />
      <Chip label="Prive" active={filter === 'PRIVE'} count={counts.PRIVE} onPress={() => setFilter('PRIVE')} />
      <Chip
        label="Urgent"
        active={filter === 'urgent'}
        count={counts.urgent > 0 ? counts.urgent : undefined}
        onPress={() => setFilter('urgent')}
        icon={<Ionicons name="flash" size={12} color={filter === 'urgent' ? '#FFD23F' : '#1A1A1A'} />}
      />
      <Chip
        label="<5 km"
        active={filter === 'near'}
        count={counts.near > 0 ? counts.near : undefined}
        onPress={() => setFilter('near')}
      />
    </ScrollView>
  )
}

interface ChipProps {
  label: string
  active: boolean
  count?: number
  onPress: () => void
  icon?: React.ReactNode
}

function Chip({ label, active, count, onPress, icon }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center rounded-full ${active ? 'bg-ink dark:bg-night-brand' : 'bg-paper dark:bg-night-surface border border-line dark:border-night-border'}`}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 8,
        gap: 6,
        shadowColor: '#000',
        shadowOpacity: active ? 0.18 : 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: active ? 4 : 2,
      }}
      hitSlop={6}
    >
      {icon}
      <Text className={`text-xs font-sans-bold ${active ? 'text-paper dark:text-secondary' : 'text-secondary dark:text-night-text'}`}>{label}</Text>
      {count != null && count > 0 && (
        <View className={`ml-0.5 px-1.5 py-0.5 rounded-full ${active ? 'bg-primary' : 'bg-warm-100'}`}>
          <Text className={`text-[10px] font-sans-extrabold ${active ? 'text-secondary' : 'text-secondary'}`}>
            {count}
          </Text>
        </View>
      )}
    </Pressable>
  )
}
