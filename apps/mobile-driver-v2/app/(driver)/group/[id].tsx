import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import type { Group, GroupMemberStats } from '@taxilink/core';
import {
  driverBlockService,
  groupService,
  groupStatsService,
  reportError,
  type GroupActivitySummary,
  type GroupDailyActivity,
} from '@taxilink/services';

import { Icon } from '@/components/icons/Icon';
import { ScreenHamburgerHeader } from '@/components/navigation/ScreenHamburgerHeader';
import { BlockDriverModal } from '@/components/groupes/BlockDriverModal';
import { PasswordConfirmModal } from '@/components/groupes/PasswordConfirmModal';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/lib/theme';

// Écran détail d'un groupe — réplique apps/web/.../groupes/GroupDetailScreen.tsx.
// Connecté à la base via groupService.getMyGroups + groupStatsService (summary + memberStats).
// Stubs : groupActivityService (events feed) + driverBlockService non portés → omis.
export default function GroupDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const [group, setGroup] = useState<Group | null>(null);
  const [summary, setSummary] = useState<GroupActivitySummary | null>(null);
  const [daily, setDaily] = useState<GroupDailyActivity[]>([]);
  const [members, setMembers] = useState<GroupMemberStats[]>([]);
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [showAllMembers, setShowAllMembers] = useState(false);

  // Modals — block (no password), kick + delete-group (password requis pour admin)
  const [blockTarget, setBlockTarget] = useState<GroupMemberStats | null>(null);
  const [kickTarget, setKickTarget] = useState<GroupMemberStats | null>(null);
  const [showDeleteGroup, setShowDeleteGroup] = useState(false);

  useEffect(() => {
    if (!id || !user?.id) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        // 1) Trouver le groupe parmi mes groupes (vérifie aussi droit d'accès via RLS implicite)
        const myGroups = await groupService.getMyGroups(user.id);
        if (cancelled) return;
        const found = myGroups.find((g) => g.id === id) ?? null;
        setGroup(found);
        if (!found) return;

        // 2) Charger summary + daily + member stats + blockedIds en parallèle (best-effort)
        const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
        const [s, d, m, b] = await Promise.all([
          groupStatsService.getActivitySummary(id).catch(() => null),
          groupStatsService.getDailyActivity(id, 7).catch(() => [] as GroupDailyActivity[]),
          groupStatsService.getMemberStats(id, since).catch(() => [] as GroupMemberStats[]),
          driverBlockService.getBlockedIds(user.id).catch(() => [] as string[]),
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
  }, [id, user?.id]);

  // Mes stats personnelles dans ce groupe (position dans le classement d'activité)
  const myStats = useMemo(() => {
    if (!user?.id || members.length === 0) return null;
    const sorted = [...members].sort(
      (a, b) => (b.sharedCount + b.acceptedCount) - (a.sharedCount + a.acceptedCount),
    );
    const myIdx = sorted.findIndex((m) => m.driverId === user.id);
    if (myIdx === -1) return null;
    const me = sorted[myIdx]!;
    const total = sorted.length;
    return {
      shared: me.sharedCount,
      accepted: me.acceptedCount,
      percentile: Math.round(((myIdx + 1) / total) * 100),
      totalMembers: total,
    };
  }, [members, user?.id]);

  // Suis-je admin de ce groupe ? Dérivé du rôle de mon row dans members
  // (plus robuste que group.createdBy seul si plusieurs admins existent).
  const isAdmin = useMemo(() => {
    if (!user?.id) return false;
    return members.some((m) => m.driverId === user.id && m.role === 'admin');
  }, [members, user?.id]);

  const onlineMembers = useMemo(() => members.filter((m) => m.isOnline), [members]);
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

  // Auto-leave (non-admin) — un seul tap, sans mot de passe (action réversible :
  // un re-join est toujours possible si on connaît l'ID du groupe).
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

  function handlePostCourse() {
    // TODO: Créer une course pour ce groupe — à brancher sur le flow Publier.
  }

  // Open BlockDriverModal — pas de mot de passe (block = réversible côté profil).
  function openBlockModal(member: GroupMemberStats) {
    if (!user?.id || member.driverId === user.id) return;
    setBlockTarget(member);
  }

  // Open kick modal — réservé à l'admin courant. Mot de passe requis.
  function openKickModal(member: GroupMemberStats) {
    if (!user?.id || member.driverId === user.id) return;
    setKickTarget(member);
  }

  // Confirme le retrait du membre après vérif du mdp (admin + DB RLS attendue).
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

  // Confirme la suppression complète du groupe après vérif du mdp (admin only).
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
        <ScreenHamburgerHeader activeTab="groupes" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.bg }}>
        <ScreenHamburgerHeader activeTab="groupes" />
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
  const available = summary?.available ?? 0;
  const online = summary?.onlineCount ?? 0;
  const exchanged = summary?.exchanged7d ?? 0;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHamburgerHeader
        activeTab="groupes"
        rightSlot={
          // Bouton retour vers la liste /groupes. router.back() est suffisant car
          // l'utilisateur arrive toujours du screen liste (push). En fallback (deep
          // link direct sur /group/[id]), on push explicitement /groupes.
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
        {/* Hero card centrée */}
        <View
          style={{
            borderRadius: 22,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            paddingHorizontal: 24, paddingTop: 26, paddingBottom: 18,
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 80, height: 80, borderRadius: 16,
              // Identité visuelle : carre noir + initiale brand jaune. On garde noir en dark aussi.
              backgroundColor: '#0F0F0F',
              alignItems: 'center', justifyContent: 'center',
              marginBottom: 12,
            }}
          >
            <Text style={{ color: colors.brand, fontSize: 36, fontWeight: '800', lineHeight: 40 }}>
              {group.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={{ fontSize: 22, fontWeight: '800', color: colors.ink, textAlign: 'center', letterSpacing: -0.4 }}>
            {group.name}
          </Text>
          {group.description && (
            <Text style={{ fontSize: 13, color: colors.inkSoft, marginTop: 4, textAlign: 'center', lineHeight: 18 }}>
              {group.description}
            </Text>
          )}
          {/* Favori chip */}
          <View
            style={{
              marginTop: 12,
              borderRadius: 999,
              backgroundColor: isFav ? colors.brand : colors.pillBg,
              overflow: 'hidden',
            }}
          >
            <Pressable
              onPress={() => setIsFav((v) => !v)}
              android_ripple={{ color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 5 }}
            >
              <Text style={{ fontSize: 12, color: isFav ? '#0F0F0F' : colors.inkMuted }}>
                {isFav ? '★' : '☆'}
              </Text>
              <Text style={{ fontSize: 11, fontWeight: '900', color: isFav ? '#0F0F0F' : colors.inkMuted, letterSpacing: 0.6 }}>
                {isFav ? 'FAVORI' : 'AJOUTER AUX FAVORIS'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Live banner si courses dispo */}
        {available > 0 && (
          <View
            style={{
              borderRadius: 14,
              backgroundColor: isDark ? colors.accent : '#0F0F0F',
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success }} />
            <Text style={{ flex: 1, fontSize: 13.5, fontWeight: '800', color: '#FFFFFF' }}>
              {available} course{available > 1 ? 's' : ''} dispo en ce moment
            </Text>
            <View style={{ borderRadius: 999, backgroundColor: colors.brand, paddingHorizontal: 12, paddingVertical: 5, overflow: 'hidden' }}>
              <Pressable onPress={() => router.push('/')} android_ripple={{ color: 'rgba(0,0,0,0.1)' }}>
                <Text style={{ fontSize: 12, fontWeight: '900', color: '#0F0F0F' }}>Voir</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* 3 stats */}
        <View
          style={{
            flexDirection: 'row',
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            paddingVertical: 14,
          }}
        >
          <Stat value={memberCount} label="Membres" />
          <Stat value={online} label="En ligne" border dot={online > 0} />
          <Stat value={exchanged} label="Échangées (7j)" border />
        </View>

        {/* Online strip */}
        {onlineMembers.length > 0 && (
          <View style={{ borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 10 }}>
            <Text style={{ fontSize: 10.5, fontWeight: '900', color: colors.inkSoft, letterSpacing: 0.5, marginBottom: 8 }}>
              EN LIGNE MAINTENANT
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {onlineMembers.slice(0, 6).map((m) => (
                <Avatar key={m.driverId} name={memberDisplayName(m)} online />
              ))}
              {onlineMembers.length > 6 && (
                <View
                  style={{
                    width: 36, height: 36, borderRadius: 18,
                    backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border,
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '800', color: colors.inkMuted }}>
                    +{onlineMembers.length - 6}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* CTA principal + secondaire */}
        <View style={{ gap: 8 }}>
          <View style={{ height: 56, borderRadius: 14, backgroundColor: isDark ? colors.accent : '#0F0F0F', overflow: 'hidden' }}>
            <Pressable
              onPress={handlePostCourse}
              android_ripple={{ color: 'rgba(255,255,255,0.15)' }}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <Icon name="plus" size={18} color={colors.brand} strokeWidth={2.5} />
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#FFFFFF' }}>Poster une course</Text>
            </Pressable>
          </View>
          <View style={{ height: 44, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, overflow: 'hidden' }}>
            <Pressable
              onPress={handleInvite}
              android_ripple={{ color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <Icon name="users" size={16} color={colors.inkMuted} strokeWidth={1.8} />
              <Text style={{ fontSize: 13.5, fontWeight: '800', color: colors.ink }}>Inviter un confrère</Text>
            </Pressable>
          </View>
        </View>

        {/* Mes stats personnelles — réplique PWA MyGroupStatsPanel */}
        {myStats && <MyStatsPanel stats={myStats} />}

        {/* Activité 7 jours — réplique PWA GroupActivityFeed (header + barres uniquement) */}
        <ActivityFeed total={exchanged} daily={daily} />

        {/* Members section */}
        <View style={{ marginTop: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingHorizontal: 4 }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: colors.ink }}>Membres</Text>
            {memberCount > 4 && !showAllMembers && (
              <Pressable
                onPress={() => setShowAllMembers(true)}
                android_ripple={{ color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.inkMuted }}>
                  Voir les {memberCount}
                </Text>
                <Text style={{ fontSize: 14, color: colors.inkMuted }}>›</Text>
              </Pressable>
            )}
          </View>
          <View style={{ gap: 8 }}>
            {visibleMembers.length === 0 && (
              <Text style={{ fontSize: 13, color: colors.inkSoft, textAlign: 'center', paddingVertical: 18 }}>
                Aucun membre chargé
              </Text>
            )}
            {visibleMembers.map((m) => (
              <MemberRow
                key={m.driverId}
                member={m}
                isMe={m.driverId === user?.id}
                isAdminViewer={isAdmin}
                isBlocked={blockedIds.includes(m.driverId)}
                onToggleBlock={() => openBlockModal(m)}
                onKick={() => openKickModal(m)}
              />
            ))}
          </View>
        </View>

        {/* Bouton bas — Supprimer le groupe (admin) ou Quitter le groupe (membre).
            Couleurs alignées à 100% sur ProfileMenuRow tone='danger' (cf.
            "Supprimer mon compte" du profil) — en dark on utilise des rgba
            translucides explicites (pas `colors.dangerSoft` qui est `#4A1F1F`
            trop sombre pour ressortir sur le fond #2A2F38). */}
        {isAdmin ? (
          <View
            style={{
              marginTop: 12,
              height: 48,
              borderRadius: 14,
              backgroundColor: isDark ? 'rgba(248, 113, 113, 0.12)' : colors.dangerSoft,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(248, 113, 113, 0.45)' : 'rgba(163,45,45,0.25)',
              overflow: 'hidden',
            }}
          >
            <Pressable
              onPress={() => setShowDeleteGroup(true)}
              android_ripple={{ color: isDark ? 'rgba(248,113,113,0.15)' : 'rgba(163,45,45,0.10)' }}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <Icon name="trash" size={16} color={colors.danger} strokeWidth={1.8} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.danger }}>Supprimer le groupe</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ marginTop: 12, height: 48, borderRadius: 14, borderWidth: 1, borderColor: colors.danger, backgroundColor: colors.surface, overflow: 'hidden', opacity: leaving ? 0.5 : 1 }}>
            <Pressable
              onPress={handleLeave}
              disabled={leaving}
              android_ripple={{ color: 'rgba(220,38,38,0.08)' }}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontSize: 14, fontWeight: '800', color: colors.danger }}>
                {leaving ? 'Sortie…' : 'Quitter le groupe'}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Modal block / unblock confrère — pas de mot de passe (réversible) */}
      {blockTarget && user?.id && (
        <BlockDriverModal
          open
          blockerId={user.id}
          targetId={blockTarget.driverId}
          targetName={memberDisplayName(blockTarget)}
          initialBlocked={blockedIds.includes(blockTarget.driverId)}
          onClose={() => setBlockTarget(null)}
          onChanged={(nowBlocked) => {
            setBlockedIds((prev) => {
              if (nowBlocked) return prev.includes(blockTarget.driverId) ? prev : [...prev, blockTarget.driverId];
              return prev.filter((id) => id !== blockTarget.driverId);
            });
          }}
        />
      )}

      {/* Modal kick membre (admin) — mdp requis */}
      {kickTarget && user?.email && (
        <PasswordConfirmModal
          open
          email={user.email}
          title={`Retirer ${memberDisplayName(kickTarget)} du groupe ?`}
          description={`${memberDisplayName(kickTarget)} ne pourra plus voir les annonces de ${group.name}. Pour annuler, il faudra l'inviter à nouveau via l'identifiant du groupe. Confirme avec ton mot de passe pour éviter les retraits par erreur.`}
          confirmLabel={`Retirer ${memberDisplayName(kickTarget)}`}
          destructive
          onConfirmed={confirmKick}
          onClose={() => setKickTarget(null)}
        />
      )}

      {/* Modal supprimer groupe (admin) — mdp requis */}
      {showDeleteGroup && user?.email && (
        <PasswordConfirmModal
          open
          email={user.email}
          title={`Supprimer "${group.name}" ?`}
          description="Le groupe et tous ses membres seront supprimés définitivement. Cette action est irréversible. Confirme avec ton mot de passe pour éviter les suppressions par erreur."
          confirmLabel="Supprimer le groupe"
          destructive
          onConfirmed={confirmDeleteGroup}
          onClose={() => setShowDeleteGroup(false)}
        />
      )}
    </SafeAreaView>
  );
}

function Stat({ value, label, border = false, dot = false }: { value: number; label: string; border?: boolean; dot?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', borderLeftWidth: border ? 1 : 0, borderLeftColor: colors.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        {dot && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success }} />}
        <Text style={{ fontSize: 20, fontWeight: '800', color: colors.ink, lineHeight: 22 }}>{value}</Text>
      </View>
      <Text style={{ fontSize: 10.5, color: colors.inkSoft, marginTop: 4, fontWeight: '500' }}>{label}</Text>
    </View>
  );
}

function Avatar({ name, online }: { name: string; online?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={{ position: 'relative' }}>
      <View
        style={{
          width: 36, height: 36, borderRadius: 18,
          // Avatar identite : noir + brand jaune, garde le pattern dans les deux modes.
          backgroundColor: '#0F0F0F',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: '900', color: colors.brand }}>
          {initials(name)}
        </Text>
      </View>
      {online && (
        <View
          style={{
            position: 'absolute', bottom: -1, right: -1,
            width: 10, height: 10, borderRadius: 5,
            backgroundColor: colors.success,
            borderWidth: 2, borderColor: colors.surface,
          }}
        />
      )}
    </View>
  );
}

function MemberRow({
  member, isMe, isAdminViewer, isBlocked, onToggleBlock, onKick,
}: {
  member: GroupMemberStats;
  isMe: boolean;
  isAdminViewer: boolean;
  isBlocked: boolean;
  onToggleBlock: () => void;
  onKick: () => void;
}) {
  const { colors, isDark } = useTheme();
  const name = memberDisplayName(member);
  const phone = member.phone?.replace(/\s/g, '') ?? null;
  const waNum = phone?.startsWith('0') ? `33${phone.slice(1)}` : phone;
  const activity = member.sharedCount + member.acceptedCount;
  const subline = isBlocked
    ? 'Bloqué·e'
    : member.role === 'admin'
      ? `${activity} activité${activity > 1 ? 's' : ''}`
      : member.isOnline ? 'En ligne' : 'Hors ligne';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 10,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
      }}
    >
      <Avatar name={name} online={member.isOnline} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '700', color: colors.ink }}>
          {name}{isMe ? ' (toi)' : ''}
        </Text>
        <Text numberOfLines={1} style={{ fontSize: 12, marginTop: 2, color: isBlocked ? colors.danger : colors.inkSoft, fontWeight: isBlocked ? '700' : '400' }}>
          {subline}
        </Text>
      </View>
      {member.role === 'admin' && (
        <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: colors.brand }}>
          <Text style={{ fontSize: 10, fontWeight: '900', color: '#0F0F0F', letterSpacing: 0.5 }}>ADMIN</Text>
        </View>
      )}
      {/* 4 boutons icônes : SMS (white) / WhatsApp (green light) / Tel (green dark) / Block (circle slash) */}
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {phone && !isBlocked && (
          <>
            <ContactBtn bg={colors.surface} border onPress={() => Linking.openURL(`sms:${phone}`)}>
              <Icon name="message-square" size={14} color={colors.ink} strokeWidth={2} />
            </ContactBtn>
            <ContactBtn bg="#25D366" onPress={() => waNum && Linking.openURL(`whatsapp://send?phone=${waNum}`).catch(() => Linking.openURL(`https://wa.me/${waNum}`))}>
              <Icon name="message-circle" size={14} color="#FFFFFF" strokeWidth={2.2} />
            </ContactBtn>
            <ContactBtn bg={colors.success} onPress={() => Linking.openURL(`tel:${phone}`)}>
              <Icon name="phone" size={14} color="#FFFFFF" strokeWidth={2.2} />
            </ContactBtn>
          </>
        )}
        {!isMe && (
          // Bloquer : rouge doux, MÊME palette que ProfileMenuRow tone='danger'.
          // En dark on utilise rgba translucide explicite (le `colors.dangerSoft`
          // trop sombre #4A1F1F serait invisible sur le fond gris-bleu).
          <ContactBtn
            bg={
              isBlocked
                ? colors.danger
                : isDark ? 'rgba(248, 113, 113, 0.12)' : colors.dangerSoft
            }
            border={!isBlocked}
            borderColor={
              !isBlocked
                ? (isDark ? 'rgba(248, 113, 113, 0.45)' : 'rgba(163,45,45,0.25)')
                : undefined
            }
            onPress={onToggleBlock}
          >
            <Icon
              name={isBlocked ? 'shield-off' : 'ban'}
              size={14}
              color={isBlocked ? '#FFFFFF' : colors.danger}
              strokeWidth={2}
            />
          </ContactBtn>
        )}
        {/* Bouton kick — admin only, jamais sur soi-même.
            Couleur noire (≠ rouge du bloquer) : "action admin officielle",
            distincte visuellement du bloquer pour éviter la confusion. */}
        {isAdminViewer && !isMe && (
          <ContactBtn bg="#0F0F0F" onPress={onKick}>
            <Icon name="trash" size={14} color="#FFFFFF" strokeWidth={2} />
          </ContactBtn>
        )}
      </View>
    </View>
  );
}

function ContactBtn({
  bg, border = false, borderColor, onPress, children,
}: { bg: string; border?: boolean; borderColor?: string; onPress: () => void; children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{
      width: 32, height: 32, borderRadius: 8,
      backgroundColor: bg,
      borderWidth: border ? 1 : 0,
      borderColor: borderColor ?? colors.border,
      overflow: 'hidden',
    }}>
      <Pressable onPress={onPress} android_ripple={{ color: 'rgba(0,0,0,0.1)' }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </Pressable>
    </View>
  );
}

// Réplique PWA MyGroupStatsPanel — icône TrendingUp dans pastille brand/15 +
// label MES STATS · PRIVÉ + phrase avec partagé/accepté en bold + ligne Top X%
// (uniquement si percentile <= 30 ET activité > 0).
function MyStatsPanel({
  stats,
}: { stats: { shared: number; accepted: number; percentile: number; totalMembers: number } }) {
  const { colors } = useTheme();
  const isTop = stats.percentile <= 30;
  const totalActivity = stats.shared + stats.accepted;
  return (
    <View
      style={{
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
      }}
    >
      <View
        style={{
          width: 36, height: 36, borderRadius: 12,
          backgroundColor: 'rgba(255, 209, 26, 0.18)',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Icon name="trending-up" size={16} color={colors.ink} strokeWidth={2} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 10, fontWeight: '900', color: colors.inkSoft, letterSpacing: 1.4, marginBottom: 4 }}>
          MES STATS · PRIVÉ
        </Text>
        <Text style={{ fontSize: 13.5, color: colors.ink, lineHeight: 18 }}>
          Tu as <Text style={{ fontWeight: '800' }}>partagé {stats.shared}</Text> course{stats.shared > 1 ? 's' : ''}
          {' '}et <Text style={{ fontWeight: '800' }}>accepté {stats.accepted}</Text> course{stats.accepted > 1 ? 's' : ''}
          {' '}dans ce groupe.
        </Text>
        {isTop && totalActivity > 0 && (
          <Text style={{ fontSize: 12, color: colors.success, fontWeight: '700', marginTop: 4 }}>
            Top {stats.percentile}% du groupe sur l'activité.
          </Text>
        )}
      </View>
    </View>
  );
}

// Réplique PWA GroupActivityFeed (sans le feed événements — pas de service
// groupActivityService côté mobile pour l'instant). Header + 7 mini-barres,
// barre du jour en jaune brand, autres jours en beige.
function ActivityFeed({ total, daily }: { total: number; daily: GroupDailyActivity[] }) {
  const { colors, isDark } = useTheme();
  const max = Math.max(1, ...daily.map((d) => d.count));
  const today = new Date().toISOString().slice(0, 10);
  return (
    <View
      style={{
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.borderSoft,
        backgroundColor: colors.surfaceMuted,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <View style={{ flexShrink: 0 }}>
        <Text style={{ fontSize: 10, fontWeight: '900', color: colors.inkSoft, letterSpacing: 1.4 }}>
          ACTIVITÉ · 7 JOURS
        </Text>
        <Text style={{ fontSize: 26, fontWeight: '800', color: colors.ink, lineHeight: 28, marginTop: 4 }}>
          {total}
        </Text>
        <Text style={{ fontSize: 11, color: colors.inkSoft, marginTop: 4 }}>Courses échangées</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 40 }}>
        {daily.map((d) => {
          const ratio = d.count / max;
          const heightPx = Math.max(4, Math.round(ratio * 40));
          const isToday = d.date === today;
          return (
            <View
              key={d.date}
              style={{
                width: 10,
                height: heightPx,
                borderTopLeftRadius: 4,
                borderTopRightRadius: 4,
                backgroundColor: isToday ? colors.brand : (isDark ? colors.border : '#D9D7CF'),
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

function memberDisplayName(m: GroupMemberStats): string {
  if (m.lastName && m.firstName) return `${m.lastName} ${m.firstName.charAt(0).toUpperCase()}.`;
  return m.fullName || m.lastName || m.firstName || 'Confrère';
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || '??';
}
