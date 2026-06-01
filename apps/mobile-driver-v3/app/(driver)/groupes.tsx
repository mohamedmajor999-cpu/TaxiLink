import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import type { Group } from '@taxilink/core';
import { groupService, groupStatsService, reportError, type GroupActivitySummary } from '@taxilink/services';

import { Icon } from '@/components/icons/Icon';
import { useAuth } from '@/hooks/useAuth';
import { useGroupFavorites } from '@/hooks/useGroupFavorites';
import { GroupesHeader } from '@/components/groupes/GroupesHeader';
import { GroupesHeroCard } from '@/components/groupes/GroupesHeroCard';
import { GroupCard } from '@/components/groupes/GroupCard';
import { GroupesGlobalPulse } from '@/components/groupes/GroupesGlobalPulse';
import { GroupesSortChips, type SortMode } from '@/components/groupes/GroupesSortChips';
import { CreateGroupModal } from '@/components/groupes/CreateGroupModal';
import { JoinGroupModal } from '@/components/groupes/JoinGroupModal';
import { ScreenTopBar } from '@/components/navigation/ScreenTopBar';
import { useTheme } from '@/lib/theme';

// Écran "Mes groupes" — réplique apps/web/.../DriverGroupesScreen.tsx.
// Stubs : pas de groupStatsService côté mobile (compteurs live = 0),
// modals Créer/Rejoindre via Alert prompt, favoris locaux non persistés.
export default function GroupesScreen() {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const [groups, setGroups] = useState<Group[]>([]);
  const [summaries, setSummaries] = useState<Record<string, GroupActivitySummary>>({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  // Favoris persistés (AsyncStorage + user_metadata.favorite_group_ids).
  // Survit aux navigations, kills d'app et changements d'appareil.
  const favorites = useGroupFavorites();
  const [sortMode, setSortMode] = useState<SortMode>('activity');

  // État du modal "Rejoindre un groupe"
  const [showJoin, setShowJoin] = useState(false);
  const [joinId, setJoinId] = useState('');
  const [joinSaving, setJoinSaving] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // État du modal "Créer un groupe"
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const list = await groupService.getMyGroups(user.id);
        if (cancelled) return;
        setGroups(list);
        // Fetch summaries en parallèle (best-effort, on ne casse pas l'UI si une fail)
        if (list.length > 0) {
          const results = await Promise.allSettled(
            list.map((g) => groupStatsService.getActivitySummary(g.id).then((s) => [g.id, s] as const)),
          );
          if (cancelled) return;
          const map: Record<string, GroupActivitySummary> = {};
          for (const r of results) {
            if (r.status === 'fulfilled') {
              const [id, s] = r.value;
              map[id] = s;
            }
          }
          setSummaries(map);
        }
      } catch (err) {
        reportError(err, { tags: { phase: 'groupes-fetch' } });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((g) =>
      g.name.toLowerCase().includes(q) || (g.description ?? '').toLowerCase().includes(q),
    );
  }, [groups, query]);

  // Hero = 1er favori valide (favorites.ids[0]), sinon 1er groupe
  const primaryGroup = useMemo<Group | null>(() => {
    for (const id of favorites.ids) {
      const g = groups.find((x) => x.id === id);
      if (g) return g;
    }
    return groups[0] ?? null;
  }, [favorites.ids, groups]);

  const otherGroups = useMemo(
    () => filtered.filter((g) => !primaryGroup || g.id !== primaryGroup.id),
    [filtered, primaryGroup],
  );

  // Tri appliqué à la liste "Mes autres groupes" :
  // - 'activity' : courses dispo desc, puis online desc (pondéré ×1000 pour prio)
  // - 'recent'   : ordre DB (createdAt desc retourné par getMyGroups)
  // - 'name'     : alphabétique fr
  const sortedOtherGroups = useMemo<Group[]>(() => {
    if (sortMode === 'name') {
      return [...otherGroups].sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    }
    if (sortMode === 'recent') return otherGroups;
    return [...otherGroups].sort((a, b) => {
      const sa = summaries[a.id]; const sb = summaries[b.id];
      const va = (sa?.available ?? 0) * 1000 + (sa?.onlineCount ?? 0);
      const vb = (sb?.available ?? 0) * 1000 + (sb?.onlineCount ?? 0);
      return vb - va;
    });
  }, [otherGroups, sortMode, summaries]);

  // Pulse global agrégé sur TOUS mes groupes (pas seulement les filtrés).
  // Dedup online via Set<driverId> + exclusion du user lui-meme (le libelle
  // dit "collegues en ligne" = autres que moi). Avant : 1 user dans 3 groupes
  // online affichait "3 collegues en ligne". Bug rapporte 2026-05-24.
  const globalPulse = useMemo(() => {
    let availableTotal = 0;
    const uniqueOnline = new Set<string>();
    for (const g of groups) {
      const s = summaries[g.id];
      if (!s) continue;
      availableTotal += s.available;
      for (const id of s.onlineDriverIds ?? []) uniqueOnline.add(id);
    }
    if (user?.id) uniqueOnline.delete(user.id);
    return { availableTotal, onlineTotal: uniqueOnline.size };
  }, [groups, summaries, user?.id]);

  function openGroup(g: Group) {
    router.push(`/group/${g.id}`);
  }

  function handleCreate() {
    setCreateError(null);
    setNewName('');
    setNewDesc('');
    setShowCreate(true);
  }

  async function submitCreate() {
    if (!user?.id) return;
    const name = newName.trim();
    if (!name) return;
    setCreateSaving(true);
    setCreateError(null);
    try {
      const created = await groupService.create(name, newDesc.trim() || null, user.id);
      // Insère en tête de liste (UX immédiate) + ferme le modal + reset les champs
      setGroups((prev) => [created, ...prev]);
      // Charge le summary du nouveau groupe en best-effort
      groupStatsService.getActivitySummary(created.id).then((s) => {
        setSummaries((prev) => ({ ...prev, [created.id]: s }));
      }).catch(() => {});
      setShowCreate(false);
      setNewName('');
      setNewDesc('');
    } catch (err) {
      reportError(err, { tags: { phase: 'group-create' } });
      setCreateError(err instanceof Error ? err.message : 'Impossible de créer ce groupe.');
    } finally {
      setCreateSaving(false);
    }
  }

  function handleJoin() {
    setJoinError(null);
    setJoinId('');
    setShowJoin(true);
  }

  async function submitJoin() {
    if (!user?.id) return;
    const id = joinId.trim();
    if (!id) return;
    setJoinSaving(true);
    setJoinError(null);
    try {
      await groupService.join(id, user.id);
      // Re-fetch la liste à jour (incl. le nouveau groupe + son summary)
      const list = await groupService.getMyGroups(user.id);
      setGroups(list);
      // Charge le summary du nouveau groupe en best-effort
      const newGroup = list.find((g) => g.id === id);
      if (newGroup) {
        groupStatsService.getActivitySummary(id).then((s) => {
          setSummaries((prev) => ({ ...prev, [id]: s }));
        }).catch(() => {});
      }
      setShowJoin(false);
      setJoinId('');
    } catch (err) {
      reportError(err, { tags: { phase: 'group-join' } });
      setJoinError('Groupe introuvable, identifiant invalide ou tu en es déjà membre.');
    } finally {
      setJoinSaving(false);
    }
  }

  async function handleLeave(group: Group) {
    if (!user?.id) return;
    Alert.alert(
      'Quitter le groupe',
      `Tu vas quitter "${group.name}". Tu devras demander à l'admin de t'y réinviter.`,
      [
        { text: 'Garder', style: 'cancel' },
        {
          text: 'Quitter',
          style: 'destructive',
          onPress: async () => {
            try {
              await groupService.leave(group.id, user.id);
              setGroups((prev) => prev.filter((g) => g.id !== group.id));
            } catch (err) {
              reportError(err, { tags: { phase: 'group-leave' } });
              Alert.alert('Erreur', 'Impossible de quitter ce groupe.');
            }
          },
        },
      ],
    );
  }

  async function handleDelete(group: Group) {
    Alert.alert(
      'Supprimer le groupe',
      `Le groupe "${group.name}" et tous ses membres seront supprimés définitivement. Cette action est irréversible.`,
      [
        { text: 'Garder', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await groupService.deleteGroup(group.id);
              setGroups((prev) => prev.filter((g) => g.id !== group.id));
            } catch (err) {
              reportError(err, { tags: { phase: 'group-delete' } });
              Alert.alert('Erreur', 'Impossible de supprimer ce groupe.');
            }
          },
        },
      ],
    );
  }

  function isAdmin(g: Group): boolean {
    return g.createdBy === user?.id;
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenTopBar title="Mes groupes" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 18, paddingBottom: 140 }}
      >
        <GroupesHeader
          totalCount={groups.length}
          favoriteCount={favorites.ids.filter((id) => groups.some((g) => g.id === id)).length}
          onCreate={handleCreate}
          onJoin={handleJoin}
        />

        {loading ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.brand} />
          </View>
        ) : groups.length === 0 ? (
          <EmptyState onCreate={handleCreate} onJoin={handleJoin} />
        ) : (
          <>
            {/* Live banner agrégé sur tous les groupes */}
            <GroupesGlobalPulse
              availableTotal={globalPulse.availableTotal}
              onlineTotal={globalPulse.onlineTotal}
            />

            {primaryGroup && (
              <GroupesHeroCard
                group={primaryGroup}
                available={summaries[primaryGroup.id]?.available ?? 0}
                online={summaries[primaryGroup.id]?.onlineCount ?? 0}
                exchanged7d={summaries[primaryGroup.id]?.exchanged7d ?? 0}
                isFavorite={favorites.has(primaryGroup.id)}
                onOpen={() => openGroup(primaryGroup)}
                onPostCourse={() => openGroup(primaryGroup)}
                onToggleFavorite={() => favorites.toggle(primaryGroup.id)}
              />
            )}

            {/* Search */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingHorizontal: 16,
                marginBottom: 14,
                height: 44,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surface,
              }}
            >
              <Icon name="search" size={16} color={colors.inkSoft} strokeWidth={1.8} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Rechercher dans mes groupes"
                placeholderTextColor={colors.inkSoft}
                style={{ flex: 1, fontSize: 13, color: colors.ink, padding: 0 }}
              />
            </View>

            {/* Chips de tri (cachés si pas d'autres groupes à trier) */}
            {sortedOtherGroups.length > 0 && (
              <GroupesSortChips value={sortMode} onChange={setSortMode} />
            )}

            {filtered.length === 0 ? (
              <View
                style={{
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  padding: 32,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 13, color: colors.inkMuted, textAlign: 'center' }}>
                  Aucun groupe ne correspond à « {query} »
                </Text>
              </View>
            ) : sortedOtherGroups.length > 0 ? (
              <>
                {primaryGroup && (
                  <Text style={{ fontSize: 10, fontWeight: '800', color: colors.inkSoft, letterSpacing: 1.4, marginBottom: 8, paddingHorizontal: 4 }}>
                    MES AUTRES GROUPES
                  </Text>
                )}
                <View style={{ gap: 12 }}>
                  {sortedOtherGroups.map((g) => (
                    <GroupCard
                      key={g.id}
                      group={g}
                      isAdmin={isAdmin(g)}
                      available={summaries[g.id]?.available ?? 0}
                      online={summaries[g.id]?.onlineCount ?? 0}
                      isFavorite={favorites.has(g.id)}
                      onOpen={() => openGroup(g)}
                      onLeave={() => handleLeave(g)}
                      onDelete={() => handleDelete(g)}
                      onToggleFavorite={() => favorites.toggle(g.id)}
                    />
                  ))}
                </View>
              </>
            ) : null}
          </>
        )}
      </ScrollView>

      <JoinGroupModal
        open={showJoin}
        joinId={joinId}
        setJoinId={setJoinId}
        saving={joinSaving}
        error={joinError}
        onSubmit={submitJoin}
        onClose={() => { setShowJoin(false); setJoinError(null); }}
      />

      <CreateGroupModal
        open={showCreate}
        newName={newName}
        setNewName={setNewName}
        newDesc={newDesc}
        setNewDesc={setNewDesc}
        saving={createSaving}
        error={createError}
        onSubmit={submitCreate}
        onClose={() => { setShowCreate(false); setCreateError(null); }}
      />
    </SafeAreaView>
  );
}

function EmptyState({ onCreate, onJoin }: { onCreate: () => void; onJoin: () => void }) {
  const { colors, isDark } = useTheme();
  return (
    <View
      style={{
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        padding: 32,
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: 48, height: 48, borderRadius: 14,
          backgroundColor: colors.surfaceMuted,
          alignItems: 'center', justifyContent: 'center',
          marginBottom: 12,
        }}
      >
        <Icon name="users" size={20} color={colors.inkMuted} strokeWidth={1.8} />
      </View>
      <Text style={{ fontSize: 16, fontWeight: '800', color: colors.ink, marginBottom: 4 }}>
        Aucun groupe pour l'instant
      </Text>
      <Text style={{ fontSize: 13, color: colors.inkMuted, textAlign: 'center', marginBottom: 16, lineHeight: 18 }}>
        Rejoins un groupe avec son code, ou crée le tien pour inviter tes collègues.
      </Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, overflow: 'hidden' }}>
          <Pressable
            onPress={onJoin}
            android_ripple={{ color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10 }}
          >
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.ink }}>J'ai un code</Text>
          </Pressable>
        </View>
        <View style={{ borderRadius: 999, backgroundColor: isDark ? colors.accent : '#0F0F0F', overflow: 'hidden' }}>
          <Pressable
            onPress={onCreate}
            android_ripple={{ color: 'rgba(255,255,255,0.15)' }}
            style={{ paddingHorizontal: 16, paddingVertical: 10 }}
          >
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>Créer un groupe</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
