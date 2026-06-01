import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/icons/Icon';
import { useTheme } from '@/lib/theme';

interface Props {
  fullName: string;
  initials: string;
  licenseNumber?: string | null;
  city?: string | null;
  mainDepartement?: string | null;
  onEdit?: () => void;
}

export function ProfileHeroCard({
  fullName,
  initials,
  licenseNumber,
  city,
  mainDepartement,
  onEdit,
}: Props) {
  const { colors } = useTheme();
  const subtitleLine1 = ['Chauffeur taxi', licenseNumber ? `Licence n° ${licenseNumber}` : null]
    .filter(Boolean)
    .join(' · ');
  const subtitleLine2 = [city, mainDepartement].filter(Boolean).join(' · ');

  return (
    <View
      style={{
        position: 'relative',
        backgroundColor: colors.brand,
        borderRadius: 24,
        paddingHorizontal: 20,
        paddingVertical: 20,
        marginBottom: 20,
        overflow: 'hidden',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16 }}>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: '#000000',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 3,
            borderColor: '#FFFFFF',
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '600', letterSpacing: -0.3 }}>
            {initials}
          </Text>
        </View>

        <View style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
          <Text
            numberOfLines={1}
            style={{ fontSize: 19, fontWeight: '700', color: '#000000', letterSpacing: -0.3 }}
          >
            {fullName}
          </Text>
          {!!subtitleLine1 && (
            <Text style={{ fontSize: 12.5, color: 'rgba(0,0,0,0.75)', marginTop: 4, lineHeight: 16 }}>
              {subtitleLine1}
            </Text>
          )}
          {!!subtitleLine2 && (
            <Text style={{ fontSize: 12.5, color: 'rgba(0,0,0,0.75)', lineHeight: 16 }}>
              {subtitleLine2}
            </Text>
          )}
        </View>
      </View>

      {onEdit && (
        <Pressable
          onPress={onEdit}
          accessibilityLabel="Modifier le profil"
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: 'rgba(0,0,0,0.1)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="pencil" size={16} color="#000000" strokeWidth={2} />
        </Pressable>
      )}
    </View>
  );
}
