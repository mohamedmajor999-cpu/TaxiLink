import { Pressable, Text, View } from 'react-native';
import type { Group } from '@taxilink/core';
import { Icon } from '@/components/icons/Icon';
import { useTheme } from '@/lib/theme';

interface Props {
  group: Group;
  available: number;
  online: number;
  exchanged7d: number;
  isFavorite: boolean;
  onOpen: () => void;
  onPostCourse: () => void;
  onToggleFavorite: () => void;
}

// Réplique apps/web/.../GroupesHeroCard.tsx — bordure ink 2px, badge FAVORI, avatar TL,
// 3 stats (Courses dispo / En ligne / Échangées), bouton plein noir "Poster une course".
export function GroupesHeroCard({
  group, available, online, exchanged7d,
  isFavorite, onOpen, onPostCourse, onToggleFavorite,
}: Props) {
  const { colors, isDark } = useTheme();
  const members = group.memberCount ?? 0;
  const subtitle = group.description
    ? (members > 0 ? `${group.description} · ${members} membre${members > 1 ? 's' : ''}` : group.description)
    : (members > 0 ? `${members} membre${members > 1 ? 's' : ''}` : null);

  return (
    <View
      style={{
        position: 'relative',
        marginBottom: 14,
        borderRadius: 22,
        borderWidth: 2,
        // Bord renforcé noir partout — le noir sur fond dark gris-bleu reste
        // visible et préserve l'identité TaxiLink (ne tombe pas dans le bleu).
        borderColor: '#0F0F0F',
        backgroundColor: colors.surface,
        padding: 14,
      }}
    >
      {/* Badge FAVORI absolute */}
      {isFavorite && (
        <View
          style={{
            position: 'absolute',
            top: -10,
            left: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 4,
            backgroundColor: colors.brand,
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: '900', color: '#0F0F0F' }}>★</Text>
          <Text style={{ fontSize: 10, fontWeight: '900', color: '#0F0F0F', letterSpacing: 0.5 }}>
            FAVORI
          </Text>
        </View>
      )}

      {/* Top row : avatar + nom + favori */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <Pressable
          onPress={onOpen}
          android_ripple={{ color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minWidth: 0 }}
        >
          <View style={{ position: 'relative' }}>
            <View
              style={{
                width: 52, height: 52, borderRadius: 14,
                // Avatar identitaire reste noir partout (porte la brand en initiale)
                backgroundColor: '#0F0F0F',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Text style={{ color: colors.brand, fontSize: 22, fontWeight: '800' }}>
                {group.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            {/* Pastille présence */}
            <View
              style={{
                position: 'absolute', bottom: -2, right: -2,
                width: 14, height: 14, borderRadius: 7,
                backgroundColor: available > 0 ? colors.success : colors.inkSoft,
                borderWidth: 3, borderColor: colors.surface,
              }}
            />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={{ fontSize: 17, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 }}>
              {group.name}
            </Text>
            {subtitle && (
              <Text numberOfLines={1} style={{ fontSize: 12.5, color: colors.inkSoft, marginTop: 2 }}>
                {subtitle}
              </Text>
            )}
          </View>
        </Pressable>
        {/* Étoile favori */}
        <View
          style={{
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: isFavorite ? colors.brand : colors.surface,
            borderWidth: 1, borderColor: isFavorite ? colors.brand : colors.border,
            overflow: 'hidden',
          }}
        >
          <Pressable
            onPress={onToggleFavorite}
            android_ripple={{ color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}
            accessibilityLabel={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 16, color: isFavorite ? '#0F0F0F' : colors.inkSoft }}>
              {isFavorite ? '★' : '☆'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* 3 stats */}
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: colors.surfaceMuted,
          borderRadius: 12,
          paddingVertical: 12,
          marginBottom: 14,
        }}
      >
        <Stat value={available} label="Courses dispo" pulse={available > 0} />
        <Stat value={online} label="En ligne" border />
        <Stat value={exchanged7d} label="Échangées (7j)" border />
      </View>

      {/* Bouton Poster une course — pleinement noir avec icône jaune brand */}
      <View style={{ height: 48, borderRadius: 14, backgroundColor: '#0F0F0F', overflow: 'hidden' }}>
        <Pressable
          onPress={onPostCourse}
          android_ripple={{ color: 'rgba(255,255,255,0.15)' }}
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          <Icon name="plus" size={18} color={colors.brand} strokeWidth={2.5} />
          <Text style={{ fontSize: 14.5, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.2 }}>
            Poster une course
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function Stat({ value, label, border = false, pulse = false }: { value: number; label: string; border?: boolean; pulse?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', borderLeftWidth: border ? 1 : 0, borderLeftColor: colors.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        {pulse && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success }} />}
        <Text style={{ fontSize: 20, fontWeight: '800', color: colors.ink, lineHeight: 22 }}>{value}</Text>
      </View>
      <Text style={{ fontSize: 10.5, color: colors.inkSoft, marginTop: 4, fontWeight: '500' }}>{label}</Text>
    </View>
  );
}
