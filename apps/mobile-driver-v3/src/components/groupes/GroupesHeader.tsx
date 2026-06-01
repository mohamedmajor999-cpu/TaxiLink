import { Pressable, Text, View } from 'react-native';
import { Icon } from '@/components/icons/Icon';
import { useTheme } from '@/lib/theme';

interface Props {
  totalCount: number;
  favoriteCount: number;
  onCreate: () => void;
  onJoin: () => void;
}

// Réplique apps/web/.../GroupesHeader.tsx :
// logo TL noir + titre "Mes groupes" + sous-titre count/favoris
// + bouton rond "Rejoindre" (icône lien) + pill noire "+ Créer".
export function GroupesHeader({ totalCount, favoriteCount, onCreate, onJoin }: Props) {
  const { colors, isDark } = useTheme();
  const subtitle = totalCount === 0
    ? 'Aucun groupe'
    : favoriteCount > 0
      ? `${totalCount} groupe${totalCount > 1 ? 's' : ''} · ${favoriteCount} favori${favoriteCount > 1 ? 's' : ''}`
      : `${totalCount} groupe${totalCount > 1 ? 's' : ''}`;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
      {/* Logo TL + titre */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
        <View
          style={{
            width: 40, height: 40, borderRadius: 8,
            // Logo identitaire TaxiLink : carré noir avec "TL" jaune brand
            // dans les deux modes (identité visible et reconnaissable).
            backgroundColor: '#0F0F0F',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Text style={{ color: colors.brand, fontSize: 13, fontWeight: '900', letterSpacing: -0.3 }}>TL</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.ink, letterSpacing: -0.4 }}>
            Mes groupes
          </Text>
          <Text numberOfLines={1} style={{ fontSize: 12, color: colors.inkSoft, marginTop: 1 }}>
            {subtitle}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {/* Rejoindre — bouton rond avec icône lien (chaîne) */}
        <View style={{ width: 40, height: 40, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, overflow: 'hidden' }}>
          <Pressable
            onPress={onJoin}
            android_ripple={{ color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}
            accessibilityLabel="Rejoindre un groupe avec un code"
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="link" size={16} color={colors.inkMuted} strokeWidth={1.8} />
          </Pressable>
        </View>
        {/* Créer — pill noire dans les 2 modes, identité TaxiLink */}
        <View style={{ height: 40, borderRadius: 999, backgroundColor: '#0F0F0F', overflow: 'hidden' }}>
          <Pressable
            onPress={onCreate}
            android_ripple={{ color: 'rgba(255,255,255,0.15)' }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, height: '100%' }}
          >
            <Icon name="plus" size={14} color="#FFFFFF" strokeWidth={2.4} />
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#FFFFFF' }}>Créer</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
