import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/icons/Icon';
import { ProfileMenuRow } from './ProfileMenuRow';
import { ProfileSection } from './ProfileSection';
import { useProfileSectionRGPD } from './useProfileSectionRGPD';
import { useTheme } from '@/lib/theme';

export function ProfileSectionRGPD() {
  const r = useProfileSectionRGPD();

  return (
    <>
      <ProfileSection title="Mes données (RGPD)">
        <ProfileMenuRow
          icon="download"
          label="Télécharger mes données"
          description="Fichier JSON avec toutes vos données personnelles"
          onPress={r.downloadExport}
        />
        <ProfileMenuRow
          tone="danger"
          icon="trash"
          label="Supprimer mon compte"
          description="Anonymisation immédiate, irréversible"
          onPress={r.openConfirm}
        />
      </ProfileSection>

      <DeleteConfirmModal
        visible={r.confirmOpen}
        ack={r.confirmAck}
        onAck={r.setConfirmAck}
        deleting={r.deleting}
        error={r.deleteError}
        onCancel={r.closeConfirm}
        onConfirm={r.confirmDelete}
      />
    </>
  );
}

interface ModalProps {
  visible: boolean;
  ack: boolean;
  onAck: (v: boolean) => void;
  deleting: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

function DeleteConfirmModal({ visible, ack, onAck, deleting, error, onCancel, onConfirm }: ModalProps) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        onPress={onCancel}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.45)',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: 16,
        }}
      >
        <Pressable
          onPress={() => {}}
          style={{
            width: '100%',
            maxWidth: 480,
            backgroundColor: colors.surfaceElevated,
            borderRadius: 24,
            padding: 20,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 14,
                backgroundColor: colors.dangerSoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="shield-alert" size={20} color={colors.danger} strokeWidth={1.8} />
            </View>
            <Text style={{ flex: 1, fontSize: 17, fontWeight: '700', color: colors.ink }}>
              Supprimer mon compte
            </Text>
            <Pressable
              onPress={onCancel}
              accessibilityLabel="Fermer"
              disabled={deleting}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="x" size={18} color={colors.inkMuted} strokeWidth={2} />
            </Pressable>
          </View>

          <Text style={{ fontSize: 13.5, color: colors.ink, lineHeight: 19 }}>
            Action <Text style={{ fontWeight: '700' }}>irréversible</Text>. Vos données personnelles
            seront immédiatement anonymisées (nom remplacé par « Compte supprimé », téléphone et notes
            effacés).
          </Text>
          <Text style={{ fontSize: 12.5, color: colors.inkMuted, marginTop: 8, lineHeight: 17 }}>
            Vos courses passées sont conservées 10 ans pour les obligations comptables (factures), mais
            sans aucune donnée nominative.
          </Text>

          <Pressable
            onPress={() => onAck(!ack)}
            disabled={deleting}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: ack }}
            style={{
              marginTop: 14,
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 12,
              padding: 12,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surfaceMuted,
            }}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                borderWidth: 2,
                borderColor: ack ? colors.danger : colors.inkSoft,
                backgroundColor: ack ? colors.danger : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 1,
              }}
            >
              {ack && <Icon name="check" size={14} color="#FFFFFF" strokeWidth={3} />}
            </View>
            <Text style={{ flex: 1, fontSize: 13, color: colors.ink, lineHeight: 18 }}>
              Je comprends que cette action est irréversible et que je serai déconnecté de tous mes
              appareils.
            </Text>
          </Pressable>

          {error && (
            <View
              style={{
                marginTop: 12,
                backgroundColor: colors.dangerSoft,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
            >
              <Text style={{ color: colors.danger, fontSize: 12 }}>{error}</Text>
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
            <Pressable
              onPress={onCancel}
              disabled={deleting}
              accessibilityRole="button"
              style={({ pressed }) => ({
                flex: 1,
                height: 44,
                borderRadius: 14,
                backgroundColor: pressed ? colors.border : colors.pillBg,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: deleting ? 0.6 : 1,
              })}
            >
              <Text style={{ color: colors.ink, fontSize: 14, fontWeight: '600' }}>Annuler</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              disabled={!ack || deleting}
              accessibilityRole="button"
              style={({ pressed }) => ({
                flex: 1,
                height: 44,
                borderRadius: 14,
                backgroundColor: colors.danger,
                opacity: !ack || deleting ? 0.5 : pressed ? 0.85 : 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              })}
            >
              {deleting && <ActivityIndicator size="small" color="#FFFFFF" />}
              <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>
                {deleting ? 'Suppression…' : 'Supprimer définitivement'}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
