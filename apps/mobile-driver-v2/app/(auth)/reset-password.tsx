import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { Logo } from '@/components/brand/Logo';
import { useResetPasswordForm } from './_useResetPasswordForm';

export default function ResetPasswordScreen() {
  const f = useResetPasswordForm();

  if (f.exchanging) {
    return (
      <View className="flex-1 items-center justify-center bg-bgsoft">
        <ActivityIndicator size="large" color="#FFD23F" />
        <Text className="mt-3 text-muted text-base">Vérification du lien…</Text>
      </View>
    );
  }

  if (!f.ready) {
    return (
      <ScrollView className="flex-1 bg-bgsoft" contentContainerClassName="grow justify-center px-6 py-12">
        <Text className="text-4xl font-extrabold text-secondary text-center mb-2">Lien invalide</Text>
        <Text className="text-muted text-center text-base mb-8">{f.error ?? 'Le lien de réinitialisation est expiré ou déjà utilisé.'}</Text>
        <Pressable onPress={() => router.replace('/forgot-password')} className="h-14 rounded-xl bg-primary items-center justify-center">
          <Text className="font-bold text-secondary text-base">Renvoyer un lien</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-bgsoft"
      contentContainerClassName="grow justify-center px-6 py-12"
      keyboardShouldPersistTaps="handled"
    >
      <Logo width={240} height={48} className="self-center mb-10" />

      <Text className="text-4xl font-extrabold text-secondary text-center mb-2">Nouveau mot de passe</Text>
      <Text className="text-muted text-center text-base mb-10">Choisis un mot de passe d'au moins 8 caractères.</Text>

      <View className="bg-paper rounded-2xl p-6 gap-5 shadow-sm">
        {f.error && (
          <View className="p-4 rounded-xl bg-danger-soft border border-danger">
            <Text className="text-danger text-base">{f.error}</Text>
          </View>
        )}

        <PasswordField label="Nouveau mot de passe" value={f.password} onChange={f.setPassword} show={f.showPw} toggle={f.togglePw} />
        <PasswordField label="Confirmer" value={f.confirmPassword} onChange={f.setConfirmPassword} show={f.showPw} toggle={f.togglePw} />

        <Pressable
          onPress={f.handleSubmit}
          disabled={f.loading}
          className={`h-14 rounded-xl bg-primary items-center justify-center ${f.loading ? 'opacity-60' : ''}`}
        >
          {f.loading ? <ActivityIndicator color="#1A1A1A" /> : <Text className="font-bold text-secondary text-base">Mettre à jour</Text>}
        </Pressable>
      </View>
    </ScrollView>
  );
}

function PasswordField(p: { label: string; value: string; onChange: (v: string) => void; show: boolean; toggle: () => void }) {
  return (
    <View>
      <Text className="text-sm font-bold text-secondary uppercase mb-2 tracking-widest">{p.label}</Text>
      <View className="flex-row items-center">
        <TextInput
          value={p.value}
          onChangeText={p.onChange}
          secureTextEntry={!p.show}
          placeholder="••••••••"
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
          autoComplete="password-new"
          className="flex-1 h-14 px-5 pr-14 rounded-xl border-2 border-line bg-paper text-base font-semibold text-secondary"
        />
        <Pressable onPress={p.toggle} className="absolute right-3 h-14 w-10 items-center justify-center" hitSlop={8}>
          <Text className="text-muted text-xl">{p.show ? '🙈' : '👁'}</Text>
        </Pressable>
      </View>
    </View>
  );
}
