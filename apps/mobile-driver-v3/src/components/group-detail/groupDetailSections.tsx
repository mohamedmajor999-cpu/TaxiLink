import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import type { Group, GroupMemberStats } from '@taxilink/core';

import { Icon } from '@/components/icons/Icon';
import { BlockDriverModal } from '@/components/groupes/BlockDriverModal';
import { PasswordConfirmModal } from '@/components/groupes/PasswordConfirmModal';
import { useTheme } from '@/lib/theme';
import { Avatar, MemberRow, memberDisplayName } from './groupDetailParts';

// Sections JSX de l'ecran detail groupe (hero / banner / CTA / members / danger
// button / modals). Extraites du fichier page pour respecter le seuil 200
// lignes par page (CLAUDE.md). Reste pure-UI : les handlers sont passes en
// props depuis la page.

export function GroupHero({ group, isFav, onToggleFav }: { group: Group; isFav: boolean; onToggleFav: () => void }) {
  const { colors, isDark } = useTheme();
  return (
    <View
      style={{
        borderRadius: 22, borderWidth: 1, borderColor: colors.border,
        backgroundColor: colors.surface,
        paddingHorizontal: 24, paddingTop: 26, paddingBottom: 18,
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: 80, height: 80, borderRadius: 16,
          backgroundColor: '#0F0F0F',
          alignItems: 'center', justifyContent: 'center', marginBottom: 12,
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
      <View
        style={{
          marginTop: 12, borderRadius: 999,
          backgroundColor: isFav ? colors.brand : colors.pillBg, overflow: 'hidden',
        }}
      >
        <Pressable
          onPress={onToggleFav}
          android_ripple={{ color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 5 }}
        >
          <Text style={{ fontSize: 12, color: isFav ? '#0F0F0F' : colors.inkMuted }}>{isFav ? '★' : '☆'}</Text>
          <Text style={{ fontSize: 11, fontWeight: '900', color: isFav ? '#0F0F0F' : colors.inkMuted, letterSpacing: 0.6 }}>
            {isFav ? 'FAVORI' : 'AJOUTER AUX FAVORIS'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export function AvailableBanner({ count }: { count: number }) {
  const { colors, isDark } = useTheme();
  if (count <= 0) return null;
  return (
    <View
      style={{
        borderRadius: 14, backgroundColor: isDark ? colors.accent : '#0F0F0F',
        padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10,
      }}
    >
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success }} />
      <Text style={{ flex: 1, fontSize: 13.5, fontWeight: '800', color: '#FFFFFF' }}>
        {count} course{count > 1 ? 's' : ''} dispo en ce moment
      </Text>
      <View style={{ borderRadius: 999, backgroundColor: colors.brand, paddingHorizontal: 12, paddingVertical: 5, overflow: 'hidden' }}>
        <Pressable onPress={() => router.push('/')} android_ripple={{ color: 'rgba(0,0,0,0.1)' }}>
          <Text style={{ fontSize: 12, fontWeight: '900', color: '#0F0F0F' }}>Voir</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function OnlineMembersStrip({ members }: { members: GroupMemberStats[] }) {
  const { colors } = useTheme();
  if (members.length === 0) return null;
  return (
    <View style={{ borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 10 }}>
      <Text style={{ fontSize: 10.5, fontWeight: '900', color: colors.inkSoft, letterSpacing: 0.5, marginBottom: 8 }}>
        EN LIGNE MAINTENANT
      </Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {members.slice(0, 6).map((m) => (
          <Avatar key={m.driverId} name={memberDisplayName(m)} online />
        ))}
        {members.length > 6 && (
          <View
            style={{
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '800', color: colors.inkMuted }}>
              +{members.length - 6}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

export function GroupCtaButtons({ onPostCourse, onInvite }: { onPostCourse: () => void; onInvite: () => void }) {
  const { colors, isDark } = useTheme();
  return (
    <View style={{ gap: 8 }}>
      <View style={{ height: 56, borderRadius: 14, backgroundColor: isDark ? colors.accent : '#0F0F0F', overflow: 'hidden' }}>
        <Pressable
          onPress={onPostCourse}
          android_ripple={{ color: 'rgba(255,255,255,0.15)' }}
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          <Icon name="plus" size={18} color={colors.brand} strokeWidth={2.5} />
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#FFFFFF' }}>Poster une course</Text>
        </Pressable>
      </View>
      <View style={{ height: 44, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, overflow: 'hidden' }}>
        <Pressable
          onPress={onInvite}
          android_ripple={{ color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          <Icon name="users" size={16} color={colors.inkMuted} strokeWidth={1.8} />
          <Text style={{ fontSize: 13.5, fontWeight: '800', color: colors.ink }}>Inviter un confrère</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function MembersSection({
  memberCount, visibleMembers, showAllMembers, onShowAll,
  currentUserId, isAdmin, blockedIds, onBlock, onKick,
}: {
  memberCount: number;
  visibleMembers: GroupMemberStats[];
  showAllMembers: boolean;
  onShowAll: () => void;
  currentUserId: string | null;
  isAdmin: boolean;
  blockedIds: string[];
  onBlock: (m: GroupMemberStats) => void;
  onKick: (m: GroupMemberStats) => void;
}) {
  const { colors, isDark } = useTheme();
  return (
    <View style={{ marginTop: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingHorizontal: 4 }}>
        <Text style={{ fontSize: 15, fontWeight: '800', color: colors.ink }}>Membres</Text>
        {memberCount > 4 && !showAllMembers && (
          <Pressable
            onPress={onShowAll}
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
            isMe={m.driverId === currentUserId}
            isAdminViewer={isAdmin}
            isBlocked={blockedIds.includes(m.driverId)}
            onToggleBlock={() => onBlock(m)}
            onKick={() => onKick(m)}
          />
        ))}
      </View>
    </View>
  );
}

export function GroupDangerButton({
  isAdmin, leaving, onLeave, onDelete,
}: {
  isAdmin: boolean;
  leaving: boolean;
  onLeave: () => void;
  onDelete: () => void;
}) {
  const { colors, isDark } = useTheme();
  if (isAdmin) {
    return (
      <View
        style={{
          marginTop: 12, height: 48, borderRadius: 14,
          backgroundColor: isDark ? 'rgba(248, 113, 113, 0.12)' : colors.dangerSoft,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(248, 113, 113, 0.45)' : 'rgba(163,45,45,0.25)',
          overflow: 'hidden',
        }}
      >
        <Pressable
          onPress={onDelete}
          android_ripple={{ color: isDark ? 'rgba(248,113,113,0.15)' : 'rgba(163,45,45,0.10)' }}
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          <Icon name="trash" size={16} color={colors.danger} strokeWidth={1.8} />
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.danger }}>Supprimer le groupe</Text>
        </Pressable>
      </View>
    );
  }
  return (
    <View style={{ marginTop: 12, height: 48, borderRadius: 14, borderWidth: 1, borderColor: colors.danger, backgroundColor: colors.surface, overflow: 'hidden', opacity: leaving ? 0.5 : 1 }}>
      <Pressable
        onPress={onLeave}
        disabled={leaving}
        android_ripple={{ color: 'rgba(220,38,38,0.08)' }}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
      >
        <Text style={{ fontSize: 14, fontWeight: '800', color: colors.danger }}>
          {leaving ? 'Sortie…' : 'Quitter le groupe'}
        </Text>
      </Pressable>
    </View>
  );
}

export function GroupConfirmModals({
  group, currentUserId, currentEmail,
  blockTarget, onBlockClose, onBlockChanged, initialBlocked,
  kickTarget, onKickClose, onKickConfirmed,
  showDeleteGroup, onDeleteClose, onDeleteConfirmed,
}: {
  group: Group;
  currentUserId: string | null;
  currentEmail: string | null;
  blockTarget: GroupMemberStats | null;
  onBlockClose: () => void;
  onBlockChanged: (nowBlocked: boolean) => void;
  initialBlocked: boolean;
  kickTarget: GroupMemberStats | null;
  onKickClose: () => void;
  onKickConfirmed: () => Promise<void>;
  showDeleteGroup: boolean;
  onDeleteClose: () => void;
  onDeleteConfirmed: () => Promise<void>;
}) {
  return (
    <>
      {blockTarget && currentUserId && (
        <BlockDriverModal
          open
          blockerId={currentUserId}
          targetId={blockTarget.driverId}
          targetName={memberDisplayName(blockTarget)}
          initialBlocked={initialBlocked}
          onClose={onBlockClose}
          onChanged={onBlockChanged}
        />
      )}
      {kickTarget && currentEmail && (
        <PasswordConfirmModal
          open
          email={currentEmail}
          title={`Retirer ${memberDisplayName(kickTarget)} du groupe ?`}
          description={`${memberDisplayName(kickTarget)} ne pourra plus voir les annonces de ${group.name}. Pour annuler, il faudra l'inviter à nouveau via l'identifiant du groupe. Confirme avec ton mot de passe pour éviter les retraits par erreur.`}
          confirmLabel={`Retirer ${memberDisplayName(kickTarget)}`}
          destructive
          onConfirmed={onKickConfirmed}
          onClose={onKickClose}
        />
      )}
      {showDeleteGroup && currentEmail && (
        <PasswordConfirmModal
          open
          email={currentEmail}
          title={`Supprimer "${group.name}" ?`}
          description="Le groupe et tous ses membres seront supprimés définitivement. Cette action est irréversible. Confirme avec ton mot de passe pour éviter les suppressions par erreur."
          confirmLabel="Supprimer le groupe"
          destructive
          onConfirmed={onDeleteConfirmed}
          onClose={onDeleteClose}
        />
      )}
    </>
  );
}
