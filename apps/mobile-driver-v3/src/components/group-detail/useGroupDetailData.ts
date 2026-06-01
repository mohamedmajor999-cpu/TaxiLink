import { useEffect, useMemo, useState } from 'react';
import type { Group, GroupMemberStats } from '@taxilink/core';
import {
  driverBlockService,
  groupService,
  groupStatsService,
  reportError,
  type GroupActivitySummary,
  type GroupDailyActivity,
} from '@taxilink/services';

// Hook de fetch + derivation pour l'ecran detail groupe. Extrait du fichier
// page pour respecter le seuil 200 lignes (CLAUDE.md).
//
// Renvoie tout ce qui est lu depuis Supabase + les calculs derives (myStats,
// isAdmin, onlineMembers). La page consomme ces valeurs et garde la main sur
// les setters pour les operations mutatives (kick / leave / delete) qui
// modifient `members` localement.
export function useGroupDetailData({ groupId, userId }: { groupId: string | undefined; userId: string | null }) {
  const [group, setGroup] = useState<Group | null>(null);
  const [summary, setSummary] = useState<GroupActivitySummary | null>(null);
  const [daily, setDaily] = useState<GroupDailyActivity[]>([]);
  const [members, setMembers] = useState<GroupMemberStats[]>([]);
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId || !userId) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const myGroups = await groupService.getMyGroups(userId);
        if (cancelled) return;
        const found = myGroups.find((g) => g.id === groupId) ?? null;
        setGroup(found);
        if (!found) return;

        const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
        const [s, d, m, b] = await Promise.all([
          groupStatsService.getActivitySummary(groupId).catch(() => null),
          groupStatsService.getDailyActivity(groupId, 7).catch(() => [] as GroupDailyActivity[]),
          groupStatsService.getMemberStats(groupId, since).catch(() => [] as GroupMemberStats[]),
          driverBlockService.getBlockedIds(userId).catch(() => [] as string[]),
        ]);
        if (cancelled) return;
        if (s) setSummary(s);
        setDaily(d);
        setMembers(m);
        setBlockedIds(b);
      } catch (err) {
        reportError(err, { tags: { phase: 'group-detail-fetch' } });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [groupId, userId]);

  const myStats = useMemo(() => {
    if (!userId || members.length === 0) return null;
    const sorted = [...members].sort(
      (a, b) => (b.sharedCount + b.acceptedCount) - (a.sharedCount + a.acceptedCount),
    );
    const myIdx = sorted.findIndex((m) => m.driverId === userId);
    if (myIdx === -1) return null;
    const me = sorted[myIdx]!;
    return {
      shared: me.sharedCount,
      accepted: me.acceptedCount,
      percentile: Math.round(((myIdx + 1) / sorted.length) * 100),
      totalMembers: sorted.length,
    };
  }, [members, userId]);

  const isAdmin = useMemo(
    () => !!userId && members.some((m) => m.driverId === userId && m.role === 'admin'),
    [members, userId],
  );

  const onlineMembers = useMemo(() => members.filter((m) => m.isOnline), [members]);

  return {
    group, summary, daily, members, blockedIds, loading,
    myStats, isAdmin, onlineMembers,
    setMembers, setBlockedIds,
  };
}
