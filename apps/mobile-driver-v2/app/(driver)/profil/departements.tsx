import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ALL_DEPARTEMENTS } from '@taxilink/core';

import { Icon } from '@/components/icons/Icon';
import { ProfileSubHeader } from '@/components/profil/ProfileSubHeader';
import { useDepartementsScreen } from '@/components/profil/useDepartementsScreen';
import { useTheme } from '@/lib/theme';

export default function DepartementsRoute() {
  const h = useDepartementsScreen();
  const { colors, isDark } = useTheme();

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ProfileSubHeader title="Départements couverts" />
      {h.loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : (
        <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: 1.5,
              color: colors.inkSoft,
              paddingHorizontal: 4,
              marginBottom: 8,
            }}
          >
            Zones d'activité
          </Text>

          <View
            style={{
              flex: 1,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 16,
              padding: 14,
              gap: 12,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
              <Icon name="map-pin" size={16} color={colors.inkSoft} strokeWidth={1.8} />
              <Text style={{ flex: 1, fontSize: 12, color: colors.inkMuted, lineHeight: 16 }}>
                Sélectionne les départements où tu veux recevoir des missions. Aucune sélection ⇒
                tu vois toutes les missions.
              </Text>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 8 }}
            >
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {ALL_DEPARTEMENTS.map((d) => {
                  const checked = h.selected.has(d.code);
                  return (
                    <Pressable
                      key={d.code}
                      onPress={() => h.toggle(d.code)}
                      disabled={h.saving}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingHorizontal: 10,
                        paddingVertical: 7,
                        borderRadius: 999,
                        backgroundColor: checked ? (isDark ? colors.pillBg : '#FFF7CC') : colors.surfaceElevated,
                        borderWidth: 1,
                        borderColor: checked ? colors.brand : colors.border,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: 'monospace',
                          fontSize: 11,
                          color: colors.inkSoft,
                        }}
                      >
                        {d.code}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: checked ? '700' : '500',
                          color: checked ? colors.ink : colors.inkMuted,
                        }}
                      >
                        {d.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            {h.error && (
              <View
                style={{
                  backgroundColor: colors.dangerSoft,
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
              >
                <Text style={{ color: colors.danger, fontSize: 12 }}>{h.error}</Text>
              </View>
            )}

            <Pressable
              onPress={h.save}
              disabled={!h.dirty || h.saving}
              accessibilityRole="button"
              style={({ pressed }) => ({
                height: 44,
                borderRadius: 12,
                // CTA noire en light → accent bleu Tesla en dark
                backgroundColor: isDark ? colors.accent : '#000000',
                opacity: !h.dirty || h.saving ? 0.4 : pressed ? 0.85 : 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              })}
            >
              {h.saving && <ActivityIndicator size="small" color="#FFFFFF" />}
              {h.saved && !h.saving && <Icon name="check" size={16} color="#FFFFFF" strokeWidth={2.5} />}
              <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>
                {h.saved ? 'Enregistré' : `Enregistrer (${h.selected.size})`}
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
