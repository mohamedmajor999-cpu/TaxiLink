import { Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icons/Icon';
import { useTheme } from '@/lib/theme';
import type { HomeTypeFilter } from './homeFilterTypes';

export type DateFilter = 'all' | 'today' | 'tomorrow';

interface Props {
  visible: boolean;
  filter: HomeTypeFilter;
  counts: Record<HomeTypeFilter, number>;
  urgentOnly: boolean;
  nearbyOnly: boolean;
  hasUserCoords: boolean;
  dateFilter: DateFilter;
  onFilterChange: (key: HomeTypeFilter) => void;
  onUrgentToggle: () => void;
  onNearbyToggle: () => void;
  onDateFilterChange: (d: DateFilter) => void;
  onClose: () => void;
}

// V8 (2026-05-19) : remplacement des chips horizontales par un menu hamburger.
// Tous les filtres regroupes dans une bottom sheet, plus lisible et permet
// d'ajouter de nouveaux filtres (ex : Date) sans encombrer la carte.
export function FiltersSheet({
  visible,
  filter, counts, urgentOnly, nearbyOnly, hasUserCoords, dateFilter,
  onFilterChange, onUrgentToggle, onNearbyToggle, onDateFilterChange,
  onClose,
}: Props) {
  const { colors, isDark } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <SafeAreaView edges={['bottom']} style={{ backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
          <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
            <View
              style={{
                width: 44, height: 5, borderRadius: 999, backgroundColor: colors.border,
                alignSelf: 'center', marginBottom: 14,
              }}
            />
            <Text style={{ fontSize: 22, fontWeight: '900', color: colors.ink, letterSpacing: -0.4 }}>
              Filtres
            </Text>
          </View>

          {/* Type : Tout / Médical / Privé */}
          <Section title="Type" colors={colors}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <SegBtn label={`Tout · ${counts.ALL}`} active={filter === 'ALL'} onPress={() => onFilterChange('ALL')} />
              <SegBtn label={`Médical · ${counts.CPAM}`} active={filter === 'CPAM'} onPress={() => onFilterChange('CPAM')} />
              <SegBtn label={`Privé · ${counts.PRIVE}`} active={filter === 'PRIVE'} onPress={() => onFilterChange('PRIVE')} />
            </View>
          </Section>

          {/* Date : Tous / Aujourd'hui / Demain */}
          <Section title="Date" colors={colors}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <SegBtn label="Tous" active={dateFilter === 'all'} onPress={() => onDateFilterChange('all')} />
              <SegBtn label="Aujourd'hui" active={dateFilter === 'today'} onPress={() => onDateFilterChange('today')} />
              <SegBtn label="Demain" active={dateFilter === 'tomorrow'} onPress={() => onDateFilterChange('tomorrow')} />
            </View>
          </Section>

          {/* Toggles */}
          <Section title="Options" colors={colors}>
            <ToggleRow
              icon="zap"
              label="Urgent (sous 2h)"
              active={urgentOnly}
              onPress={onUrgentToggle}
            />
            {hasUserCoords && (
              <ToggleRow
                icon="locate"
                label="À moins de 5 km"
                active={nearbyOnly}
                onPress={onNearbyToggle}
              />
            )}
          </Section>

          {/* Bouton fermer */}
          <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
            <View
              style={{
                height: 48,
                borderRadius: 14,
                backgroundColor: isDark ? colors.accent : '#0F0F0F',
                overflow: 'hidden',
              }}
            >
              <Pressable
                onPress={onClose}
                android_ripple={{ color: 'rgba(255,255,255,0.18)' }}
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 14.5, fontWeight: '900', letterSpacing: -0.2 }}>
                  Voir les résultats
                </Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function Section({ title, children, colors }: { title: string; children: React.ReactNode; colors: ReturnType<typeof useTheme>['colors'] }) {
  return (
    <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
      <Text style={{ fontSize: 11, fontWeight: '800', color: colors.inkSoft, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function SegBtn({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors, isDark } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        height: 40,
        borderRadius: 12,
        backgroundColor: active ? (isDark ? colors.accent : '#0F0F0F') : colors.surfaceMuted,
        overflow: 'hidden',
      }}
    >
      <Pressable
        onPress={onPress}
        android_ripple={{ color: active ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)' }}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 }}
      >
        <Text
          numberOfLines={1}
          style={{
            fontSize: 12.5,
            fontWeight: '800',
            color: active ? '#FFFFFF' : colors.ink,
            letterSpacing: -0.1,
          }}
        >
          {label}
        </Text>
      </Pressable>
    </View>
  );
}

function ToggleRow({ icon, label, active, onPress }: { icon: IconName; label: string; active: boolean; onPress: () => void }) {
  const { colors, isDark } = useTheme();
  return (
    <View
      style={{
        marginBottom: 8,
        borderRadius: 12,
        backgroundColor: active ? (isDark ? 'rgba(59,130,246,0.18)' : 'rgba(255,210,63,0.18)') : colors.surfaceMuted,
        overflow: 'hidden',
      }}
    >
      <Pressable
        onPress={onPress}
        android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 14,
          paddingVertical: 12,
          gap: 12,
        }}
      >
        <Icon name={icon} size={18} color={colors.ink} strokeWidth={2.2} />
        <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: colors.ink }}>
          {label}
        </Text>
        <View
          style={{
            width: 22, height: 22, borderRadius: 6, borderWidth: 2,
            borderColor: active ? (isDark ? colors.accent : '#0F0F0F') : colors.border,
            backgroundColor: active ? (isDark ? colors.accent : '#0F0F0F') : 'transparent',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          {active && <Icon name="check" size={14} color="#FFFFFF" strokeWidth={3} />}
        </View>
      </Pressable>
    </View>
  );
}
