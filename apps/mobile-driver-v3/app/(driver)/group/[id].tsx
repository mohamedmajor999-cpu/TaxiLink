import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import type { GroupMemberStats } from '@taxilink/core';
import { groupService, reportError } from '@taxilink/services';

import { Icon } from '@/components/icons/Icon';
import { ScreenTopBar } from '@/components/navigation/ScreenTopBar';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/lib/theme';
import {
  ActivityFeed,
  MyStatsPanel,
  Stat,
} from '@/components/group-detail/groupDetailParts';
import {
  AvailableBanner,
  GroupConfirmModals,
  GroupCtaButtons,
  GroupDangerButton,
  GroupHero,
  MembersSection,
  OnlineMembersStrip,
} from '@/components/group-detail/groupDetailSections';
import { useGroupDetailData } from '@/components/group-detail/useGroupDetailData';

// Ecran detail d'un groupe. Le fetch + les derivations (myStats, isAdmin,
// onlineMembers) vivent dans useGroupDetailData. Toutes les sections JSX
// (hero, banner, CTA, members, danger button, modals) vivent dans
// src/components/group-detail/groupDetailSections. Ce fichier garde
// uniquement les handlers mutatifs (kick / leave / delete / fav) et
// l'orchestration JSX.
export default function GroupDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();

  const {
    group, summary, daily, members, blockedIds, loading,
    myStats, isAdmin, onlineMembers,
    setMembers, setBlockedIds,
  } = useGroupDetailData({ groupId: id, userId: user?.id ?? null });

  const [leaving, setLeaving] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [blockTarget, setBlockTarget] = useState<GroupMemberStats | null>(null);
  const [kickTarget, setKickTarget] = useState<GroupMemberStats | null>(null);
  const [showDeleteGroup, setShowDeleteGroup] = useState(false);

  const visibleMembers = useMemo(
    () => (showAllMembers ? members : members.slice(0, 4)),
    [members, showAllMembers],
  );

  async function handleInvite() {
    if (!group) return;
    const link = `https://taxilink.app/dashboard/chauffeur/groupes/join/${group.id}`;
    try {
      await Share.share({
        message: `Rejoins le groupe "${group.name}" sur TaxiLink : ${link}`,
        title: `Inviter au groupe ${group.name}`,
      });
    } catch (err) {
      reportError(err, { tags: { phase: 'group-invite-share' } });
    }
  }

  async function handleLeave() {
    if (!group || !user?.id) return;
    setLeaving(true);
    try {
      await groupService.leave(group.id, user.id);
      router.back();
    } catch (err) {
      reportError(err, { tags: { phase: 'group-leave' } });
      setLeaving(false);
    }
  }

  async function confirmKick() {
    if (!group || !kickTarget) return;
    try {
      await groupService.removeMember(group.id, kickTarget.driverId);
      setMembers((prev) => prev.filter((m) => m.driverId !== kickTarget.driverId));
    } catch (err) {
      reportError(err, { tags: { phase: 'group-kick' } });
      throw err;
    }
  }

  async function confirmDeleteGroup() {
    if (!group) return;
    try {
      await groupService.deleteGroup(group.id);
      router.back();
    } catch (err) {
      reportError(err, { tags: { phase: 'group-delete' } });
      throw err;
    }
  }

  if (loading) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.bg }}>
        <ScreenTopBar title="Groupe" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.bg }}>
        <ScreenTopBar title="Groupe" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.ink, marginBottom: 6 }}>
            Groupe introuvable
          </Text>
          <Text style={{ fontSize: 13, color: colors.inkSoft, textAlign: 'center' }}>
            Tu n'es peut-être plus membre de ce groupe.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const memberCount = group.memberCount ?? members.length;
  const initialBlocked = blockTarget ? blockedIds.includes(blockTarget.driverId) : false;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenTopBar
        title={group.name}
        rightSlot={
          <View style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.push('/groupes'))}
              android_ripple={{ color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}
              accessibilityLabel="Retour à mes groupes"
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name="arrow-left" size={18} color={colors.ink} strokeWidth={2} />
            </Pressable>
          </View>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 32, gap: 12 }}
      >
        <GroupHero group={group} isFav={isFav} onToggleFav={() => setIsFav((v) => !v)} />
        <AvailableBanner count={summary?.available ?? 0} />
        <View style={{ flexDirection: 'row', borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingVertical: 14 }}>
          <Stat value={memberCount} label="Membres" />
          <Stat value={summary?.onlineCount ?? 0} label="En ligne" border dot={(summary?.onlineCount ?? 0) > 0} />
          <Stat value={summary?.exchanged7d ?? 0} label="Échangées (7j)" border />
        </View>
        <OnlineMembersStrip members={onlineMembers} />
        <GroupCtaButtons onPostCourse={() => { /* TODO publier flow */ }} onInvite={handleInvite} />
        {myStats && <MyStatsPanel stats={myStats} />}
        <ActivityFeed total={summary?.exchanged7d ?? 0} daily={daily} />
        <MembersSection
          memberCount={memberCount}
          visibleMembers={visibleMembers}
          showAllMembers={showAllMembers}
          onShowAll={() => setShowAllMembers(true)}
          currentUserId={user?.id ?? null}
          isAdmin={isAdmin}
          blockedIds={blockedIds}
          onBlock={(m) => { if (user?.id && m.driverId !== user.id) setBlockTarget(m); }}
          onKick={(m) => { if (user?.id && m.driverId !== user.id) setKickTarget(m); }}
        />
        <GroupDangerButton
          isAdmin={isAdmin}
          leaving={leaving}
          onLeave={handleLeave}
          onDelete={() => setShowDeleteGroup(true)}
        />
      </ScrollView>

      <GroupConfirmModals
        group={group}
        currentUserId={user?.id ?? null}
        currentEmail={user?.email ?? null}
        blockTarget={blockTarget}
        onBlockClose={() => setBlockTarget(null)}
        onBlockChanged={(nowBlocked) => {
          if (!blockTarget) return;
          setBlockedIds((prev) => {
            if (nowBlocked) return prev.includes(blockTarget.driverId) ? prev : [...prev, blockTarget.driverId];
            return prev.filter((id) => id !== blockTarget.driverId);
          });
        }}
        initialBlocked={initialBlocked}
        kickTarget={kickTarget}
        onKickClose={() => setKickTarget(null)}
        onKickConfirmed={confirmKick}
        showDeleteGroup={showDeleteGroup}
        onDeleteClose={() => setShowDeleteGroup(false)}
        onDeleteConfirmed={confirmDeleteGroup}
      />
    </SafeAreaView>
  );
}
