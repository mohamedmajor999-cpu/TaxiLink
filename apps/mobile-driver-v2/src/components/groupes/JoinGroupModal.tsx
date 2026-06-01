import { ActivityIndicator, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { Icon } from '@/components/icons/Icon';
import { useTheme } from '@/lib/theme';

interface Props {
  open: boolean;
  joinId: string;
  setJoinId: (v: string) => void;
  saving: boolean;
  error: string | null;
  onSubmit: () => void;
  onClose: () => void;
}

// Modal "Rejoindre un groupe" — réplique apps/web/.../JoinGroupModal.tsx en RN.
// Backdrop noir 40 % + sheet bottom-aligned (mobile UX) avec input UUID + bouton brand jaune.
export function JoinGroupModal({ open, joinId, setJoinId, saving, error, onSubmit, onClose }: Props) {
  const { colors, isDark } = useTheme();
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
        {/* Backdrop tappable pour fermer */}
        <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} onPress={onClose} />
        {/* Sheet */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingHorizontal: 22,
            paddingTop: 18,
            paddingBottom: 28,
            gap: 14,
          }}
        >
          {/* Handle bar (visual cue) */}
          <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 4 }} />

          {/* Header : titre + bouton X */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 }}>
              Rejoindre un groupe
            </Text>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.pillBg, overflow: 'hidden' }}>
              <Pressable
                onPress={onClose}
                accessibilityLabel="Fermer"
                android_ripple={{ color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
              >
                <Icon name="x" size={16} color={colors.ink} strokeWidth={1.8} />
              </Pressable>
            </View>
          </View>

          <Text style={{ fontSize: 13, color: colors.inkMuted, lineHeight: 18 }}>
            Demande l'identifiant du groupe à son administrateur et colle-le ci-dessous.
          </Text>

          <View>
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.inkSoft, letterSpacing: 1.4, marginBottom: 6 }}>
              IDENTIFIANT DU GROUPE
            </Text>
            <TextInput
              value={joinId}
              onChangeText={setJoinId}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              placeholderTextColor={colors.inkSoft}
              autoCapitalize="none"
              autoCorrect={false}
              style={{
                height: 44,
                paddingHorizontal: 14,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                fontSize: 13,
                color: colors.ink,
                fontFamily: 'monospace',
                backgroundColor: colors.surface,
              }}
            />
          </View>

          {error && (
            <Text style={{ fontSize: 12, color: colors.danger, fontWeight: '700' }}>{error}</Text>
          )}

          <View
            style={{
              height: 48,
              borderRadius: 12,
              backgroundColor: colors.brand,
              overflow: 'hidden',
              opacity: saving || !joinId.trim() ? 0.5 : 1,
            }}
          >
            <Pressable
              onPress={onSubmit}
              disabled={saving || !joinId.trim()}
              android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {saving ? (
                <>
                  <ActivityIndicator color="#0F0F0F" />
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F0F0F' }}>Rejoindre…</Text>
                </>
              ) : (
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F0F0F' }}>
                  Rejoindre le groupe
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
