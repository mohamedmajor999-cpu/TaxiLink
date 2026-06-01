import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import { driverBlockService, reportError } from '@taxilink/services';
import { Icon } from '@/components/icons/Icon';
import { useTheme } from '@/lib/theme';

interface Props {
  open: boolean;
  blockerId: string;
  targetId: string;
  targetName: string;
  initialBlocked: boolean;
  onClose: () => void;
  onChanged: (nowBlocked: boolean) => void;
}

// Réplique apps/web/.../groupes/BlockDriverModal.tsx en bottom sheet RN.
// Liste à puces avec les conséquences du block/unblock + bouton confirm rouge
// (block) ou noir (unblock). Pas de mot de passe — block est non-destructif
// et 100% réversible côté profil.
export function BlockDriverModal({
  open, blockerId, targetId, targetName, initialBlocked, onClose, onChanged,
}: Props) {
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isUnblock = initialBlocked;

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      if (isUnblock) await driverBlockService.unblock(blockerId, targetId);
      else await driverBlockService.block(blockerId, targetId);
      onChanged(!isUnblock);
      onClose();
    } catch (err) {
      reportError(err, { tags: { phase: isUnblock ? 'driver-unblock' : 'driver-block' } });
      setError(err instanceof Error ? err.message : 'Action impossible.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
        <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} onPress={onClose} />
        <View
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 24, borderTopRightRadius: 24,
            paddingHorizontal: 22, paddingTop: 16, paddingBottom: 28,
            gap: 14,
          }}
        >
          <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border }} />

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ flex: 1, fontSize: 18, fontWeight: '800', color: colors.ink }}>
              {isUnblock ? `Débloquer ${targetName} ?` : `Bloquer ${targetName} ?`}
            </Text>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.pillBg, overflow: 'hidden' }}>
              <Pressable
                onPress={onClose}
                android_ripple={{ color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}
                accessibilityLabel="Fermer"
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
              >
                <Icon name="x" size={14} color={colors.ink} strokeWidth={1.8} />
              </Pressable>
            </View>
          </View>

          {isUnblock ? (
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 13, color: colors.inkMuted, lineHeight: 19 }}>
                En débloquant {targetName} :
              </Text>
              <Bullet text={`${targetName} reverra à nouveau tes annonces`} />
              <Bullet text="Tu reverras à nouveau les siennes" />
              <Text style={{ fontSize: 13, color: colors.inkMuted, lineHeight: 19, marginTop: 4 }}>
                Tu peux le/la rebloquer à tout moment.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 13, color: colors.inkMuted, lineHeight: 19 }}>
                En bloquant {targetName} :
              </Text>
              <Bullet text={`${targetName} ne verra plus aucune de tes annonces`} bold />
              <Bullet text="Tu ne verras plus aucune des siennes non plus" bold />
              <Text style={{ fontSize: 12, color: colors.inkSoft, lineHeight: 17, marginTop: 4 }}>
                Le blocage est discret — la personne n'est pas notifiée. Tu peux la débloquer à tout moment depuis ton profil.
              </Text>
            </View>
          )}

          {error && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name="info" size={14} color={colors.danger} strokeWidth={2.2} />
              <Text style={{ fontSize: 12, color: colors.danger, fontWeight: '700' }}>{error}</Text>
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
            <View style={{ flex: 1, height: 44, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, overflow: 'hidden' }}>
              <Pressable
                onPress={onClose}
                disabled={loading}
                android_ripple={{ color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ fontSize: 13.5, fontWeight: '700', color: colors.ink }}>Annuler</Text>
              </Pressable>
            </View>
            <View
              style={{
                flex: 1, height: 44, borderRadius: 12,
                backgroundColor: isUnblock ? (isDark ? colors.accent : '#0F0F0F') : colors.danger,
                opacity: loading ? 0.5 : 1,
                overflow: 'hidden',
              }}
            >
              <Pressable
                onPress={handleSubmit}
                disabled={loading}
                android_ripple={{ color: 'rgba(255,255,255,0.15)' }}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                {loading && <ActivityIndicator size="small" color="#FFFFFF" />}
                <Text style={{ fontSize: 13.5, fontWeight: '800', color: '#FFFFFF' }}>
                  {loading ? 'Patientez…' : isUnblock ? `Débloquer ${targetName}` : `Bloquer ${targetName}`}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Bullet({ text, bold = false }: { text: string; bold?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 8, paddingLeft: 4 }}>
      <Text style={{ fontSize: 13, color: colors.inkMuted, lineHeight: 19 }}>•</Text>
      <Text style={{ flex: 1, fontSize: 13, color: colors.ink, fontWeight: bold ? '700' : '400', lineHeight: 19 }}>
        {text}
      </Text>
    </View>
  );
}
