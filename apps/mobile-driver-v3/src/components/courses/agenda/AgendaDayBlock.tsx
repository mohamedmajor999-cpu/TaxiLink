import { Pressable, Text, View } from 'react-native';
import { Icon } from '@/components/icons/Icon';
import { useTheme } from '@/lib/theme';
import { AgendaEventCard } from './AgendaEventCard';
import type { AgendaDayGroup } from './agendaHelpers';

interface Props {
  group: AgendaDayGroup;
  onTap: (id: string) => void;
  onAdd: (date: Date) => void;
  onMenu?: (id: string) => void;
}

// Réplique apps/web/.../AgendaDayBlock.tsx en RN.
// Header jour ("Lundi 18 mai") + summary à droite ("3 courses · 245 €") + cartes + bouton "Ajouter une course".
export function AgendaDayBlock({ group, onTap, onAdd, onMenu }: Props) {
  const { colors, isDark } = useTheme();
  const summary = group.count === 0
    ? 'Rien de prévu'
    : `${group.count} course${group.count > 1 ? 's' : ''}${group.total > 0 ? ` · ${group.total.toFixed(0)} €` : ''}`;

  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 2 }}>
        <Text style={{ fontSize: 13, fontWeight: '800', color: colors.ink, textTransform: 'capitalize', flex: 1, flexShrink: 1 }} numberOfLines={1}>
          {group.label}
        </Text>
        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.inkSoft }}>{summary}</Text>
      </View>

      {group.events.map((e) => (
        <AgendaEventCard
          key={e.id}
          event={e}
          onTap={() => onTap(e.id)}
          onMenu={onMenu ? () => onMenu(e.id) : undefined}
        />
      ))}

      {/* Inline add */}
      <View style={{ borderRadius: 12, overflow: 'hidden' }}>
        <Pressable
          onPress={() => onAdd(group.date)}
          android_ripple={{ color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingHorizontal: 12,
            paddingVertical: 11,
            borderRadius: 12,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderStyle: 'dashed',
            borderColor: colors.border,
          }}
        >
          <View
            style={{
              width: 24, height: 24, borderRadius: 12,
              backgroundColor: colors.surfaceMuted,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Icon name="plus" size={14} color={colors.inkMuted} strokeWidth={2.4} />
          </View>
          <Text style={{ fontSize: 12.5, fontWeight: '700', color: colors.inkMuted }}>
            Ajouter une course à ce jour
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
