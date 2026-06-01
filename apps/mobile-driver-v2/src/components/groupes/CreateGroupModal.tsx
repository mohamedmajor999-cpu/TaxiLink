import { ActivityIndicator, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { Icon } from '@/components/icons/Icon';
import { useTheme } from '@/lib/theme';

interface Props {
  open: boolean;
  newName: string;
  setNewName: (v: string) => void;
  newDesc: string;
  setNewDesc: (v: string) => void;
  saving: boolean;
  error: string | null;
  onSubmit: () => void;
  onClose: () => void;
}

// Modal "Créer un groupe" — réplique apps/web/.../CreateGroupModal.tsx en RN.
// Bottom sheet : nom (requis) + description (optionnelle) + bouton noir Créer le groupe.
export function CreateGroupModal({
  open, newName, setNewName, newDesc, setNewDesc, saving, error, onSubmit, onClose,
}: Props) {
  const { colors, isDark } = useTheme();
  const canSubmit = !saving && newName.trim().length > 0;

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
        <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} onPress={onClose} />
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
          <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 4 }} />

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 }}>
              Créer un groupe
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

          {/* Nom */}
          <View>
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.inkSoft, letterSpacing: 1.4, marginBottom: 6 }}>
              NOM DU GROUPE *
            </Text>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="Ex : Les collègues du lundi"
              placeholderTextColor={colors.inkSoft}
              style={{
                height: 44, paddingHorizontal: 14,
                borderRadius: 12, borderWidth: 1, borderColor: colors.border,
                fontSize: 13.5, color: colors.ink,
                backgroundColor: colors.surface,
              }}
            />
          </View>

          {/* Description */}
          <View>
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.inkSoft, letterSpacing: 1.4, marginBottom: 6 }}>
              DESCRIPTION (OPTIONNEL)
            </Text>
            <TextInput
              value={newDesc}
              onChangeText={setNewDesc}
              placeholder="Ex : Chauffeurs du secteur Ouest"
              placeholderTextColor={colors.inkSoft}
              style={{
                height: 44, paddingHorizontal: 14,
                borderRadius: 12, borderWidth: 1, borderColor: colors.border,
                fontSize: 13.5, color: colors.ink,
                backgroundColor: colors.surface,
              }}
            />
          </View>

          {error && (
            <Text style={{ fontSize: 12, color: colors.danger, fontWeight: '700' }}>{error}</Text>
          )}

          {/* CTA noir */}
          <View
            style={{
              height: 48, borderRadius: 12,
              backgroundColor: isDark ? colors.accent : '#0F0F0F',
              overflow: 'hidden',
              opacity: canSubmit ? 1 : 0.5,
            }}
          >
            <Pressable
              onPress={onSubmit}
              disabled={!canSubmit}
              android_ripple={{ color: 'rgba(255,255,255,0.15)' }}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {saving ? (
                <>
                  <ActivityIndicator color={colors.brand} />
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#FFFFFF' }}>Création…</Text>
                </>
              ) : (
                <>
                  <Icon name="check" size={16} color="#FFFFFF" strokeWidth={2.2} />
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#FFFFFF' }}>Créer le groupe</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
