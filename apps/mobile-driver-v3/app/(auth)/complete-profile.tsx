import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Logo } from '@/components/brand/Logo';
import { useAuth } from '@/hooks/useAuth';
import { useCompleteProfileForm } from './_useCompleteProfileForm';

export default function CompleteProfileScreen() {
  const { user } = useAuth();
  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  // Google fournit `given_name` / `family_name` (parfois `name`), pas `first_name`/`last_name` :
  // fallback pour preremplir le formulaire et eviter au user de retaper son nom.
  const firstName = typeof meta.first_name === 'string'
    ? meta.first_name
    : typeof meta.given_name === 'string' ? meta.given_name : '';
  const lastName = typeof meta.last_name === 'string'
    ? meta.last_name
    : typeof meta.family_name === 'string' ? meta.family_name : '';
  const f = useCompleteProfileForm({
    firstName,
    lastName,
    phone: typeof meta.phone === 'string' ? meta.phone : '',
    department: Array.isArray(meta.dept_preferences) && typeof meta.dept_preferences[0] === 'string'
      ? meta.dept_preferences[0]
      : '',
  });

  return (
    <ScrollView
      className="flex-1 bg-bgsoft"
      contentContainerClassName="grow justify-center px-6 py-12"
      keyboardShouldPersistTaps="handled"
    >
      <Logo width={240} height={48} className="self-center mb-10" />

      <Text className="text-4xl font-extrabold text-secondary text-center mb-2">Compléter le profil</Text>
      <Text className="text-muted text-center text-base mb-10">Quelques infos manquent pour finaliser ton compte.</Text>

      <View className="bg-paper rounded-2xl p-6 gap-5 shadow-sm">
        {f.error && (
          <View className="p-4 rounded-xl bg-danger-soft border border-danger">
            <Text className="text-danger text-base">{f.error}</Text>
          </View>
        )}

        <Field label="Nom" value={f.lastName} onChange={f.setLastName} placeholder="Fontaine" autoCapitalize="words" />
        <Field label="Prénom" value={f.firstName} onChange={f.setFirstName} placeholder="Marc" autoCapitalize="words" />
        <Field label="Téléphone" value={f.phone} onChange={f.setPhone} placeholder="0601020304" keyboardType="phone-pad" />

        <View>
          <Text className="text-sm font-bold text-secondary uppercase mb-2 tracking-widest">Département</Text>
          <TextInput
            value={f.department}
            onChangeText={f.setDepartment}
            placeholder="13, 75, 2A…"
            placeholderTextColor="#9CA3AF"
            maxLength={3}
            autoCapitalize="characters"
            className="h-14 px-5 rounded-xl border-2 border-line bg-paper text-base font-semibold text-secondary"
          />
          {f.department.length > 0 && (
            <Text className={`mt-1.5 text-sm font-semibold ${f.departmentInfo ? 'text-success' : 'text-danger'}`}>
              {f.departmentInfo ? `✓ ${f.departmentInfo.name}` : 'Code non reconnu'}
            </Text>
          )}
        </View>

        <Pressable
          onPress={f.handleSubmit}
          disabled={f.loading}
          className={`h-14 rounded-xl bg-primary items-center justify-center ${f.loading ? 'opacity-60' : ''}`}
        >
          {f.loading ? <ActivityIndicator color="#1A1A1A" /> : <Text className="font-bold text-secondary text-base">Valider</Text>}
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Field(p: { label: string; value: string; onChange: (v: string) => void; placeholder: string; autoCapitalize?: 'none' | 'words' | 'sentences'; keyboardType?: 'default' | 'phone-pad' }) {
  return (
    <View>
      <Text className="text-sm font-bold text-secondary uppercase mb-2 tracking-widest">{p.label}</Text>
      <TextInput
        value={p.value}
        onChangeText={p.onChange}
        placeholder={p.placeholder}
        placeholderTextColor="#9CA3AF"
        autoCapitalize={p.autoCapitalize ?? 'none'}
        autoCorrect={false}
        keyboardType={p.keyboardType ?? 'default'}
        className="h-14 px-5 rounded-xl border-2 border-line bg-paper text-base font-semibold text-secondary"
      />
    </View>
  );
}
