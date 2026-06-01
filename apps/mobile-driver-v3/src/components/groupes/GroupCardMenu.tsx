import { Modal, Pressable, Text, View } from 'react-native';
import { Icon, type IconName } from '@/components/icons/Icon';
import { useTheme } from '@/lib/theme';

interface Props {
  open: boolean;
  groupName: string;
  isAdmin: boolean;
  copied: boolean;
  onClose: () => void;
  onCopyId: () => void;
  onShareSms: () => void;
  onShareWhatsApp: () => void;
  onLeave: () => void;
  onDelete: () => void;
}

// Menu actions du GroupCard — réplique apps/web GroupCardMenu.tsx en bottom sheet RN.
// 4 actions : Copier l'ID, SMS, WhatsApp, Quitter (ou Supprimer si admin).
export function GroupCardMenu({
  open, groupName, isAdmin, copied, onClose,
  onCopyId, onShareSms, onShareWhatsApp, onLeave, onDelete,
}: Props) {
  const { colors } = useTheme();
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
        <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} onPress={onClose} />
        <View
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 24, borderTopRightRadius: 24,
            paddingTop: 14, paddingBottom: 24,
            gap: 4,
          }}
        >
          <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 8 }} />

          <Text style={{ fontSize: 11, fontWeight: '900', color: colors.inkSoft, letterSpacing: 1.4, paddingHorizontal: 22, paddingBottom: 6 }}>
            {groupName.toUpperCase()}
          </Text>

          <MenuItem icon="copy" label={copied ? 'ID copié !' : "Copier l'ID"} onPress={onCopyId} />
          <MenuItem icon="message-square" label="Envoyer par SMS" onPress={onShareSms} />
          <MenuItem icon="message-circle" label="Partager WhatsApp" onPress={onShareWhatsApp} />

          <View style={{ height: 1, backgroundColor: colors.borderSoft, marginVertical: 4 }} />

          {isAdmin ? (
            <MenuItem icon="trash" label="Supprimer le groupe" onPress={onDelete} danger />
          ) : (
            <MenuItem icon="logout" label="Quitter le groupe" onPress={onLeave} danger />
          )}
        </View>
      </View>
    </Modal>
  );
}

function MenuItem({
  icon, label, onPress, danger = false,
}: { icon: IconName; label: string; onPress: () => void; danger?: boolean }) {
  const { colors, isDark } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 22, paddingVertical: 12 }}
    >
      <Icon name={icon} size={18} color={danger ? colors.danger : colors.inkMuted} strokeWidth={1.8} />
      <Text style={{ fontSize: 14, fontWeight: '600', color: danger ? colors.danger : colors.ink }}>
        {label}
      </Text>
    </Pressable>
  );
}
