import { Pressable, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

export type TabKey = 'carte' | 'courses' | 'groupes' | 'profil'

interface Props {
  active: TabKey
  onSelect: (tab: TabKey) => void
}

// Tab bar bottom 4 onglets. Visuel uniquement pour Sem 4 v2 — la vraie navigation
// inter-tabs sera cablee en Sem 10 (profil/documents) + Sem 11 (groupes).
export function DriverTabBar({ active, onSelect }: Props) {
  return (
    <View
      className="bg-paper dark:bg-night-surface border-t border-line dark:border-night-border flex-row"
      style={{
        paddingTop: 8,
        paddingBottom: 24,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: -4 },
        elevation: 8,
      }}
    >
      <Tab icon="compass" label="Carte" active={active === 'carte'} onPress={() => onSelect('carte')} />
      <Tab icon="list" label="Courses" active={active === 'courses'} onPress={() => onSelect('courses')} />
      <Tab icon="people" label="Groupes" active={active === 'groupes'} onPress={() => onSelect('groupes')} />
      <Tab icon="person" label="Profil" active={active === 'profil'} onPress={() => onSelect('profil')} />
    </View>
  )
}

interface TabProps {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  active: boolean
  onPress: () => void
}

function Tab({ icon, label, active, onPress }: TabProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 items-center justify-center"
      hitSlop={4}
      style={{ gap: 2 }}
    >
      <View
        className={active ? 'bg-primary' : ''}
        style={{
          paddingHorizontal: active ? 16 : 0,
          paddingVertical: active ? 4 : 0,
          borderRadius: 999,
        }}
      >
        <Ionicons name={icon} size={22} color={active ? '#1A1A1A' : '#9A9A9A'} />
      </View>
      <Text
        className={`text-[10px] font-sans-bold ${active ? 'text-secondary dark:text-night-text' : 'text-muted dark:text-night-text-soft'}`}
      >
        {label}
      </Text>
    </Pressable>
  )
}
