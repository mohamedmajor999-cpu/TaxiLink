import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { getSupabaseClient } from '@taxilink/services';
import { Icon } from '@/components/icons/Icon';
import { useTheme } from '@/lib/theme';

interface Props {
  open: boolean;
  email: string;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirmed: () => void | Promise<void>;
  onClose: () => void;
}

// Modal de confirmation par mot de passe — bottom sheet RN. Vérifie le mot de
// passe via `supabase.auth.signInWithPassword({ email, password })`. Si OK,
// appelle `onConfirmed()` puis ferme. Réutilisé pour : suppression de groupe
// (admin) + retrait d'un membre (admin). Évite les actions destructives par
// erreur (un tap accidentel ne suffit pas — il faut taper le mdp du compte).
export function PasswordConfirmModal({
  open, email, title, description, confirmLabel,
  destructive = true, onConfirmed, onClose,
}: Props) {
  const { colors, isDark } = useTheme();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    setPassword('');
    setError(null);
    onClose();
  }

  async function handleConfirm() {
    if (!password) {
      setError('Tape ton mot de passe.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseClient();
      const { error: authErr } = await supabase.auth.signInWithPassword({ email, password });
      if (authErr) {
        setError('Mot de passe incorrect.');
        setLoading(false);
        return;
      }
      await onConfirmed();
      setPassword('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action impossible.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
        <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} onPress={handleClose} />
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
            <Text style={{ flex: 1, fontSize: 18, fontWeight: '800', color: colors.ink }}>{title}</Text>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.pillBg, overflow: 'hidden' }}>
              <Pressable
                onPress={handleClose}
                android_ripple={{ color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}
                accessibilityLabel="Fermer"
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
              >
                <Icon name="x" size={14} color={colors.ink} strokeWidth={1.8} />
              </Pressable>
            </View>
          </View>

          <Text style={{ fontSize: 13, color: colors.inkMuted, lineHeight: 19 }}>{description}</Text>

          <View>
            <Text style={{ fontSize: 11, fontWeight: '900', color: colors.inkSoft, letterSpacing: 1.2, marginBottom: 6 }}>
              MOT DE PASSE
            </Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Ton mot de passe TaxiLink"
              placeholderTextColor={colors.inkSoft}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              style={{
                height: 46, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
                paddingHorizontal: 14, fontSize: 14, color: colors.ink, backgroundColor: colors.surface,
              }}
            />
          </View>

          {error && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name="info" size={14} color={colors.danger} strokeWidth={2.2} />
              <Text style={{ fontSize: 12, color: colors.danger, fontWeight: '700' }}>{error}</Text>
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1, height: 46, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, overflow: 'hidden' }}>
              <Pressable
                onPress={handleClose}
                disabled={loading}
                android_ripple={{ color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ fontSize: 13.5, fontWeight: '700', color: colors.ink }}>Annuler</Text>
              </Pressable>
            </View>
            <View
              style={{
                flex: 1, height: 46, borderRadius: 12,
                backgroundColor: destructive ? colors.danger : (isDark ? colors.accent : '#0F0F0F'),
                opacity: loading ? 0.5 : 1,
                overflow: 'hidden',
              }}
            >
              <Pressable
                onPress={handleConfirm}
                disabled={loading}
                android_ripple={{ color: 'rgba(255,255,255,0.15)' }}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                {loading && <ActivityIndicator size="small" color="#FFFFFF" />}
                <Text style={{ fontSize: 13.5, fontWeight: '800', color: '#FFFFFF' }}>
                  {loading ? 'Vérification…' : confirmLabel}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
