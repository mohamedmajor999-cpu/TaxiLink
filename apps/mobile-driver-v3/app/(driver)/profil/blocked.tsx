import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icons/Icon';
import { ProfileSubHeader } from '@/components/profil/ProfileSubHeader';
import { useAuth } from '@/hooks/useAuth';
import { useBlockedDriversScreen } from '@/components/profil/useBlockedDriversScreen';
import { useTheme } from '@/lib/theme';

export default function BlockedRoute() {
  const { user } = useAuth();
  const { list, loading, error, unblock } = useBlockedDriversScreen(user?.id ?? null);
  const { colors, isDark } = useTheme();

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ProfileSubHeader title="Chauffeurs bloqués" />
      <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>
        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={colors.brand} />
          </View>
        ) : error ? (
          <View
            style={{
              backgroundColor: colors.dangerSoft,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 10,
            }}
          >
            <Text style={{ color: colors.danger, fontSize: 13 }}>{error}</Text>
          </View>
        ) : list.length === 0 ? (
          <View
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 16,
              padding: 32,
              alignItems: 'center',
            }}
          >
            <Icon name="ban" size={40} color={colors.inkSoft} strokeWidth={1.5} />
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.ink, marginTop: 12, textAlign: 'center' }}>
              Aucun chauffeur bloqué
            </Text>
            <Text style={{ fontSize: 12, color: colors.inkMuted, marginTop: 6, textAlign: 'center', lineHeight: 17, maxWidth: 280 }}>
              Les collègues que tu bloques apparaissent ici. Tu ne vois plus leurs annonces, et eux ne voient plus les tiennes.
            </Text>
          </View>
        ) : (
          <>
            <Text style={{ fontSize: 12, color: colors.inkMuted, lineHeight: 17, paddingHorizontal: 4, marginBottom: 12 }}>
              Pour chacun·e : ils ne voient pas tes annonces et tu ne vois pas les leurs. Appuie sur{' '}
              <Text style={{ fontWeight: '700' }}>Débloquer</Text> pour rétablir la visibilité.
            </Text>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24, gap: 8 }}>
              {list.map((b) => (
                <View
                  key={b.blockedId}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    padding: 12,
                    borderRadius: 16,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      // Avatar identitaire reste noir partout (porte le brand en initiales)
                      backgroundColor: '#000000',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: colors.brand, fontSize: 14, fontWeight: '700' }}>
                      {(b.fullName ?? '?').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '700', color: colors.ink }}>
                      {b.fullName ?? 'Chauffeur'}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.inkMuted, marginTop: 2 }}>
                      Bloqué·e le {new Date(b.blockedAt).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => unblock(b.blockedId)}
                    accessibilityRole="button"
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      height: 36,
                      paddingHorizontal: 12,
                      borderRadius: 12,
                      // CTA secondaire noire en light → accent en dark
                      backgroundColor: isDark
                        ? (pressed ? '#1E40AF' : colors.accent)
                        : (pressed ? '#1A1A1A' : '#000000'),
                    })}
                  >
                    <Icon name="shield-off" size={14} color="#FFFFFF" strokeWidth={2.2} />
                    <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>Débloquer</Text>
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
