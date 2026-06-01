import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import type { Mission as CoreMission } from '@taxilink/core';

import { Icon } from '@/components/icons/Icon';
import { LoadErrorState } from '@/components/LoadErrorState';
import { useTheme } from '@/lib/theme';
import { AvailableMissionRow } from './AvailableMissionRow';
import { AvailableMissionSheet } from './AvailableMissionSheet';
import { useAvailableTab, type AvailableTypeFilter } from './useAvailableTab';

// Onglet 1 — Disponibles : feed marketplace masque (PII), chips filtres
// permanents (Tous / CPAM / Privé / Urgent), tap row → AvailableMissionSheet.
// Le ratio "N / M résultats" suit [[feedback-counter-vs-filtered-list]].
export function AvailableTab() {
  const { colors } = useTheme();
  const { missions, totalCount, isLoading, error, refresh, typeFilter, urgentOnly, setTypeFilter, setUrgentOnly } =
    useAvailableTab();
  const [selected, setSelected] = useState<CoreMission | null>(null);

  return (
    <View style={{ flex: 1 }}>
      {/* Chips type + urgent */}
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 6,
          paddingHorizontal: 16,
          paddingBottom: 10,
        }}
      >
        <Chip label={`Tous · ${totalCount}`} active={typeFilter === 'all'} onPress={() => setTypeFilter('all')} />
        <Chip label="CPAM" active={typeFilter === 'cpam'} onPress={() => setTypeFilter('cpam')} />
        <Chip label="Privé" active={typeFilter === 'prive'} onPress={() => setTypeFilter('prive')} />
        <Chip
          label="Urgent"
          icon="zap"
          active={urgentOnly}
          onPress={() => setUrgentOnly(!urgentOnly)}
        />
      </View>

      {/* Ratio filtré / total */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingBottom: 8,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderSoft,
          marginBottom: 6,
        }}
      >
        <Text style={{ fontSize: 12, fontWeight: '600', color: colors.inkSoft }}>
          <Text style={{ fontWeight: '900', color: colors.ink }}>{missions.length}</Text>
          {` / ${totalCount} résultats`}
        </Text>
      </View>

      {error && missions.length === 0 ? (
        <LoadErrorState onRetry={refresh} message="Impossible de charger les courses. Vérifie ta connexion et réessaie." />
      ) : isLoading && missions.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : missions.length === 0 ? (
        <Empty totalCount={totalCount} />
      ) : (
        <FlatList
          data={missions}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <AvailableMissionRow mission={item} onPress={() => setSelected(item)} />}
          contentContainerStyle={{ paddingTop: 6, paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={colors.brand} colors={[colors.brand]} />
          }
        />
      )}

      <AvailableMissionSheet mission={selected} onClose={() => setSelected(null)} />
    </View>
  );
}

function Chip({
  label,
  active,
  onPress,
  icon,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  icon?: 'zap';
}) {
  const { colors, isDark } = useTheme();
  return (
    <View
      style={{
        borderRadius: 999,
        backgroundColor: active ? (isDark ? colors.accent : '#0A0A0A') : colors.surface,
        borderWidth: active ? 0 : 1,
        borderColor: colors.border,
        overflow: 'hidden',
      }}
    >
      <Pressable
        onPress={onPress}
        android_ripple={{ color: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7 }}
      >
        {icon === 'zap' && (
          <Icon name="zap" size={11} color={active ? '#FFFFFF' : colors.ink} strokeWidth={2.4} />
        )}
        <Text style={{ fontSize: 12.5, fontWeight: '800', color: active ? '#FFFFFF' : colors.ink }}>
          {label}
        </Text>
      </Pressable>
    </View>
  );
}

function Empty({ totalCount }: { totalCount: number }) {
  const { colors } = useTheme();
  const title = totalCount === 0 ? 'Aucune course disponible' : 'Aucune course ne correspond';
  const sub =
    totalCount === 0
      ? "Patiente : les annonces s'affichent dès qu'un collègue partage une course."
      : 'Essaye de retirer les filtres CPAM / Privé / Urgent pour voir plus de courses.';
  return (
    <View style={{ alignItems: 'center', paddingHorizontal: 32, paddingVertical: 48 }}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.surfaceMuted,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 14,
        }}
      >
        <Icon name="megaphone" size={22} color={colors.inkSoft} strokeWidth={1.8} />
      </View>
      <Text style={{ fontSize: 15, fontWeight: '900', color: colors.ink, marginBottom: 6 }}>{title}</Text>
      <Text style={{ fontSize: 13, color: colors.inkSoft, textAlign: 'center', lineHeight: 18 }}>{sub}</Text>
    </View>
  );
}
