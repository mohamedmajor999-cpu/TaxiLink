import { useState } from 'react';
import { Linking, Pressable, Share, Text, View } from 'react-native';
import type { Group } from '@taxilink/core';
import { Icon } from '@/components/icons/Icon';
import { GroupCardMenu } from './GroupCardMenu';
import { useTheme } from '@/lib/theme';

interface Props {
  group: Group;
  isAdmin: boolean;
  available: number;
  online: number;
  isFavorite: boolean;
  onOpen: () => void;
  onLeave: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
}

// Réplique apps/web/.../GroupCard.tsx — avatar TL + nom + sous-ligne members/online/dispo + chevron + étoile + ⋮ menu.
export function GroupCard({
  group, isAdmin, available, online,
  isFavorite, onOpen, onLeave, onDelete, onToggleFavorite,
}: Props) {
  const { colors, isDark } = useTheme();
  const members = group.memberCount ?? 0;
  const isAlive = available > 0;
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Texte d'invitation partagé via SMS / WhatsApp / share natif (Copier l'ID).
  // Inclut nom + UUID pour que le destinataire puisse coller dans JoinGroupModal.
  const inviteText =
    `Rejoins le groupe TaxiLink "${group.name}". Identifiant : ${group.id}`;

  // Copier l'ID : pas d'expo-clipboard installé → Share.share natif RN qui
  // permet à l'utilisateur de choisir "Copier" (ou n'importe quelle action partage).
  async function handleCopyId() {
    try {
      await Share.share({ message: group.id, title: `Identifiant ${group.name}` });
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
    setMenuOpen(false);
  }

  function handleShareSms() {
    Linking.openURL(`sms:?body=${encodeURIComponent(inviteText)}`).catch(() => {});
    setMenuOpen(false);
  }

  function handleShareWhatsApp() {
    const url = `whatsapp://send?text=${encodeURIComponent(inviteText)}`;
    Linking.openURL(url).catch(() =>
      Linking.openURL(`https://wa.me/?text=${encodeURIComponent(inviteText)}`).catch(() => {}),
    );
    setMenuOpen(false);
  }

  function handleLeave() { setMenuOpen(false); onLeave(); }
  function handleDelete() { setMenuOpen(false); onDelete(); }

  return (
    <View
      style={{
        position: 'relative',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        overflow: 'visible',
      }}
    >
      {/* Top-right : favori + menu (positionnés absolute) */}
      <View
        style={{
          position: 'absolute',
          top: 10, right: 10,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          zIndex: 2,
        }}
      >
        <View
          style={{
            width: 30, height: 30, borderRadius: 15,
            backgroundColor: isFavorite ? colors.brand : colors.surface,
            borderWidth: 1, borderColor: isFavorite ? colors.brand : colors.border,
            overflow: 'hidden',
          }}
        >
          <Pressable
            onPress={onToggleFavorite}
            android_ripple={{ color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}
            accessibilityLabel={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 14, color: isFavorite ? '#0F0F0F' : colors.inkSoft }}>
              {isFavorite ? '★' : '☆'}
            </Text>
          </Pressable>
        </View>
        <View style={{ width: 30, height: 30, borderRadius: 15, overflow: 'hidden' }}>
          <Pressable
            onPress={() => setMenuOpen(true)}
            android_ripple={{ color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}
            accessibilityLabel="Actions"
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 16, fontWeight: '800', color: colors.inkMuted, lineHeight: 16 }}>⋮</Text>
          </Pressable>
        </View>
      </View>

      {/* Carte principale tappable */}
      <Pressable
        onPress={onOpen}
        android_ripple={{ color: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}
        style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14, paddingRight: 78 }}
        accessibilityLabel={`Ouvrir le groupe ${group.name}`}
      >
        {/* Avatar TL + dot dispo */}
        <View style={{ position: 'relative' }}>
          <View
            style={{
              width: 48, height: 48, borderRadius: 14,
              // Avatar identitaire reste noir partout
              backgroundColor: '#0F0F0F',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Text style={{ color: colors.brand, fontSize: 20, fontWeight: '800' }}>
              {group.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View
            style={{
              position: 'absolute', bottom: -1, right: -1,
              width: 12, height: 12, borderRadius: 6,
              backgroundColor: isAlive ? colors.success : colors.inkSoft,
              borderWidth: 2, borderColor: colors.surface,
            }}
          />
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: '800', color: colors.ink }}>
            {group.name}
          </Text>
          {group.description && (
            <Text numberOfLines={1} style={{ fontSize: 12.5, color: colors.inkSoft, marginTop: 2 }}>
              {group.description}
            </Text>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            <Icon name="users" size={13} color={colors.inkSoft} strokeWidth={1.8} />
            <Text style={{ fontSize: 12, color: colors.inkMuted }}>
              {members} membre{members > 1 ? 's' : ''}
            </Text>
            {online > 0 && (
              <>
                <Text style={{ color: colors.inkSoft }}>·</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success }} />
                  <Text style={{ fontSize: 12, color: colors.inkMuted }}>{online} en ligne</Text>
                </View>
              </>
            )}
            {isAlive && (
              <>
                <Text style={{ color: colors.inkSoft }}>·</Text>
                <Text style={{ fontSize: 12, color: colors.ink, fontWeight: '700' }}>
                  {available} course{available > 1 ? 's' : ''} dispo
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Chevron */}
        <Text style={{ fontSize: 20, fontWeight: '300', color: colors.inkSoft, alignSelf: 'center' }}>›</Text>
      </Pressable>

      <GroupCardMenu
        open={menuOpen}
        groupName={group.name}
        isAdmin={isAdmin}
        copied={copied}
        onClose={() => setMenuOpen(false)}
        onCopyId={handleCopyId}
        onShareSms={handleShareSms}
        onShareWhatsApp={handleShareWhatsApp}
        onLeave={handleLeave}
        onDelete={handleDelete}
      />
    </View>
  );
}
