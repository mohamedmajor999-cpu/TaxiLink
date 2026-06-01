import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icons/Icon';
import { ProfileSubHeader } from '@/components/profil/ProfileSubHeader';
import { useAuth } from '@/hooks/useAuth';
import { usePersonalInfoScreen } from '@/components/profil/usePersonalInfoScreen';
import { useTheme } from '@/lib/theme';

export default function PersonalInfoRoute() {
  const { user } = useAuth();
  const s = usePersonalInfoScreen(user?.id ?? null, user?.email ?? null);
  const { colors, isDark } = useTheme();

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ProfileSubHeader title="Informations personnelles" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 16,
              padding: 16,
              gap: 12,
            }}
          >
            <Field
              label="Prénom"
              value={s.firstName}
              onChange={s.setFirstName}
              disabled={s.loading || s.saving}
              placeholder="Jean"
              autoCapitalize="words"
            />
            <Field
              label="Nom"
              value={s.lastName}
              onChange={s.setLastName}
              disabled={s.loading || s.saving}
              placeholder="Dupont"
              autoCapitalize="words"
            />
            <Field
              label="Téléphone"
              value={s.phone}
              onChange={s.setPhone}
              disabled={s.loading || s.saving}
              placeholder="0601020304"
              keyboardType="phone-pad"
            />
            <View>
              <Text style={{ fontSize: 11, fontWeight: '500', color: colors.inkSoft, paddingHorizontal: 4 }}>
                Email
              </Text>
              <View
                style={{
                  marginTop: 4,
                  height: 40,
                  paddingHorizontal: 12,
                  justifyContent: 'center',
                  borderRadius: 12,
                  backgroundColor: colors.surfaceMuted,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text numberOfLines={1} style={{ fontSize: 13, color: colors.inkMuted }}>
                  {s.email || '—'}
                </Text>
              </View>
              <Text style={{ fontSize: 11, color: colors.inkSoft, paddingHorizontal: 4, marginTop: 4 }}>
                L'email est lié à ton compte et ne peut être modifié ici.
              </Text>
            </View>

            {s.error && (
              <View
                style={{
                  backgroundColor: colors.dangerSoft,
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
              >
                <Text style={{ color: colors.danger, fontSize: 12 }}>{s.error}</Text>
              </View>
            )}

            <Pressable
              onPress={s.save}
              disabled={!s.dirty || s.saving || s.loading}
              accessibilityRole="button"
              style={({ pressed }) => ({
                height: 44,
                borderRadius: 12,
                // CTA noire en light → accent bleu Tesla en dark
                backgroundColor: isDark ? colors.accent : '#000000',
                opacity: !s.dirty || s.saving || s.loading ? 0.4 : pressed ? 0.85 : 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              })}
            >
              {s.saving && <ActivityIndicator size="small" color="#FFFFFF" />}
              {s.saved && !s.saving && <Icon name="check" size={16} color="#FFFFFF" strokeWidth={2.5} />}
              <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>
                {s.saved ? 'Enregistré' : 'Enregistrer'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
  keyboardType?: 'default' | 'phone-pad' | 'email-address';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

function Field({ label, value, onChange, disabled, placeholder, keyboardType = 'default', autoCapitalize }: FieldProps) {
  const { colors } = useTheme();
  return (
    <View>
      <Text style={{ fontSize: 11, fontWeight: '500', color: colors.inkSoft, paddingHorizontal: 4 }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        editable={!disabled}
        placeholder={placeholder}
        placeholderTextColor={colors.inkSoft}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={{
          marginTop: 4,
          height: 40,
          paddingHorizontal: 12,
          borderRadius: 12,
          backgroundColor: disabled ? colors.surfaceMuted : colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          fontSize: 13,
          color: colors.ink,
        }}
      />
    </View>
  );
}
