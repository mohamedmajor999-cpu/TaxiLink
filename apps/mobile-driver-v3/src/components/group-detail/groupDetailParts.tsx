import { Linking, Pressable, Text, View } from 'react-native';
import type { ReactNode } from 'react';
import type { GroupMemberStats } from '@taxilink/core';
import type { GroupDailyActivity } from '@taxilink/services';

import { Icon } from '@/components/icons/Icon';
import { useTheme } from '@/lib/theme';

// Sous-composants et helpers de l'ecran "Detail groupe" (app/(driver)/group/[id].tsx).
// Extraits ici pour respecter le seuil 200 lignes par page (CLAUDE.md). Aucun
// fetch / aucun state metier — uniquement du rendu + Linking pour les boutons
// SMS/WhatsApp/Tel des membres.

export function memberDisplayName(m: GroupMemberStats): string {
  if (m.lastName && m.firstName) return `${m.lastName} ${m.firstName.charAt(0).toUpperCase()}.`;
  return m.fullName || m.lastName || m.firstName || 'Confrère';
}

function initials(name: string): string {
  return name.split(/\s+/).map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '??';
}

export function Stat({ value, label, border = false, dot = false }: { value: number; label: string; border?: boolean; dot?: boolean }) {
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

export function Avatar({ name, online }: { name: string; online?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={{ position: 'relative' }}>
      <View
        style={{
          width: 36, height: 36, borderRadius: 18,
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

export function MemberRow({
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
        flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10,
        borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
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
          <ContactBtn
            bg={isBlocked ? colors.danger : isDark ? 'rgba(248, 113, 113, 0.12)' : colors.dangerSoft}
            border={!isBlocked}
            borderColor={!isBlocked ? (isDark ? 'rgba(248, 113, 113, 0.45)' : 'rgba(163,45,45,0.25)') : undefined}
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

// Replique PWA MyGroupStatsPanel — icone TrendingUp dans pastille brand/15 +
// label MES STATS · PRIVE + phrase avec partage/accepte en bold + ligne Top X%
// (uniquement si percentile <= 30 ET activite > 0).
export function MyStatsPanel({
  stats,
}: { stats: { shared: number; accepted: number; percentile: number; totalMembers: number } }) {
  const { colors } = useTheme();
  const isTop = stats.percentile <= 30;
  const totalActivity = stats.shared + stats.accepted;
  return (
    <View
      style={{
        borderRadius: 16, borderWidth: 1, borderColor: colors.border,
        backgroundColor: colors.surface, padding: 14,
        flexDirection: 'row', alignItems: 'flex-start', gap: 12,
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

// Replique PWA GroupActivityFeed (sans le feed evenements). Header + 7 mini-barres,
// barre du jour en jaune brand, autres jours en beige.
export function ActivityFeed({ total, daily }: { total: number; daily: GroupDailyActivity[] }) {
  const { colors, isDark } = useTheme();
  const max = Math.max(1, ...daily.map((d) => d.count));
  const today = new Date().toISOString().slice(0, 10);
  return (
    <View
      style={{
        borderRadius: 16, borderWidth: 1, borderColor: colors.borderSoft,
        backgroundColor: colors.surfaceMuted, padding: 14,
        flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12,
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
                width: 10, height: heightPx,
                borderTopLeftRadius: 4, borderTopRightRadius: 4,
                backgroundColor: isToday ? colors.brand : (isDark ? colors.border : '#D9D7CF'),
              }}
            />
          );
        })}
      </View>
    </View>
  );
}
