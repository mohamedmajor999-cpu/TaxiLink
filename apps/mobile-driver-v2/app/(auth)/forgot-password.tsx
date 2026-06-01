import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Link, router } from 'expo-router';

import { Logo } from '@/components/brand/Logo';
import { useForgotPasswordForm } from './_useForgotPasswordForm';

export default function ForgotPasswordScreen() {
  const f = useForgotPasswordForm();

  if (f.sent) {
    return (
      <ScrollView className="flex-1 bg-bgsoft" contentContainerClassName="grow justify-center items-center px-6 py-12">
        <Text style={{ fontSize: 56 }} className="mb-4">📧</Text>
        <Text className="text-4xl font-extrabold text-secondary text-center mb-2">Email envoyé</Text>
        <Text className="text-muted text-center text-base mb-8">
          Un lien de réinitialisation a été envoyé à {f.email}. Vérifie aussi tes spams.
        </Text>
        <Pressable onPress={() => router.replace('/login')} className="h-14 rounded-xl bg-primary items-center justify-center w-full">
          <Text className="font-bold text-secondary text-base">Retour à la connexion</Text>
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

      <Text className="text-4xl font-extrabold text-secondary text-center mb-2">Mot de passe oublié</Text>
      <Text className="text-muted text-center text-base mb-10">Entre ton email, on t'envoie un lien de réinitialisation.</Text>

      <View className="bg-paper rounded-2xl p-6 gap-5 shadow-sm">
        {f.error && (
          <View className="p-4 rounded-xl bg-danger-soft border border-danger">
            <Text className="text-danger text-base">{f.error}</Text>
          </View>
        )}

        <View>
          <Text className="text-sm font-bold text-secondary uppercase mb-2 tracking-widest">Email</Text>
          <TextInput
            value={f.email}
            onChangeText={f.setEmail}
            placeholder="marc@taxilink.fr"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            className="h-14 px-5 rounded-xl border-2 border-line bg-paper text-base font-semibold text-secondary"
          />
        </View>

        <Pressable
          onPress={f.handleSubmit}
          disabled={f.loading}
          className={`h-14 rounded-xl bg-primary items-center justify-center ${f.loading ? 'opacity-60' : ''}`}
        >
          {f.loading ? <ActivityIndicator color="#1A1A1A" /> : <Text className="font-bold text-secondary text-base">Envoyer le lien</Text>}
        </Pressable>
      </View>

      <View className="items-center mt-8">
        <Link href="/login">
          <Text className="font-bold text-secondary text-base">← Retour à la connexion</Text>
        </Link>
      </View>
    </ScrollView>
  );
}
