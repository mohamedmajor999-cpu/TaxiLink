import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Link } from 'expo-router';

import { Logo } from '@/components/brand/Logo';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { useLoginForm } from './_useLoginForm';

export default function LoginScreen() {
  const {
    email, setEmail,
    password, setPassword,
    showPw, togglePw,
    loading, googleLoading, resendLoading, resendSent,
    error, needsConfirmation,
    handleSubmit, handleGoogle, handleResend,
  } = useLoginForm();

  return (
    <ScrollView
      className="flex-1 bg-bgsoft"
      contentContainerClassName="grow justify-center px-6 py-12"
      keyboardShouldPersistTaps="handled"
    >
      <Logo width={240} height={48} className="self-center mb-10" />

      <Text className="text-4xl font-extrabold text-secondary text-center mb-2">Bon retour !</Text>
      <Text className="text-muted text-center text-base mb-10">Connectez-vous à votre compte</Text>

      <View className="bg-paper rounded-2xl p-6 gap-5 shadow-sm">
        {error && !needsConfirmation && (
          <View className="p-4 rounded-xl bg-danger-soft border border-danger">
            <Text className="text-danger text-base">{error}</Text>
          </View>
        )}

        {needsConfirmation && (
          <View className="p-4 rounded-xl bg-warm-100 border border-warm-300 gap-3">
            <Text className="font-bold text-warm-800 text-base">Email non confirmé</Text>
            <Text className="text-warm-800 text-sm">Ouvre le mail envoyé à {email} et clique sur le lien. Pense aux spams.</Text>
            {resendSent ? (
              <Text className="text-success font-semibold text-sm">✓ Nouvel email envoyé.</Text>
            ) : (
              <Pressable onPress={handleResend} disabled={resendLoading} className="h-12 rounded-lg border-2 border-warm-300 bg-paper items-center justify-center">
                {resendLoading ? <ActivityIndicator color="#5F5E5A" /> : <Text className="font-bold text-warm-800 text-sm">Renvoyer l'email</Text>}
              </Pressable>
            )}
          </View>
        )}

        <View>
          <Text className="text-sm font-bold text-secondary uppercase mb-2 tracking-widest">Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="marc@taxilink.fr"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            className="h-14 px-5 rounded-xl border-2 border-line bg-paper text-base font-semibold text-secondary"
          />
        </View>

        <View>
          <Text className="text-sm font-bold text-secondary uppercase mb-2 tracking-widest">Mot de passe</Text>
          <View className="flex-row items-center">
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPw}
              placeholder="••••••••"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              autoComplete="password"
              className="flex-1 h-14 px-5 pr-14 rounded-xl border-2 border-line bg-paper text-base font-semibold text-secondary"
            />
            <Pressable onPress={togglePw} className="absolute right-3 h-14 w-10 items-center justify-center" hitSlop={8}>
              <Text className="text-muted text-xl">{showPw ? '🙈' : '👁'}</Text>
            </Pressable>
          </View>
        </View>

        <Link href="/forgot-password" asChild>
          <Pressable hitSlop={6} className="self-end -mt-1">
            <Text className="text-sm text-accent font-semibold">Mot de passe oublié ?</Text>
          </Pressable>
        </Link>

        <Pressable
          onPress={handleSubmit}
          disabled={loading}
          className={`h-14 rounded-xl bg-primary items-center justify-center ${loading ? 'opacity-60' : ''}`}
        >
          {loading ? <ActivityIndicator color="#1A1A1A" /> : <Text className="font-bold text-secondary text-base">Se connecter</Text>}
        </Pressable>

        <View className="flex-row items-center gap-3">
          <View className="flex-1 h-px bg-line" />
          <Text className="text-sm text-muted font-semibold">ou</Text>
          <View className="flex-1 h-px bg-line" />
        </View>

        <GoogleSignInButton loading={googleLoading} disabled={loading} onPress={handleGoogle} />
      </View>

      <View className="flex-row justify-center mt-8">
        <Text className="text-base text-muted">Pas encore de compte ? </Text>
        <Link href="/register">
          <Text className="font-bold text-secondary text-base">Créer un compte gratuit</Text>
        </Link>
      </View>

      <Text className="text-center text-sm text-muted mt-6 px-4">
        En vous connectant, vous acceptez nos CGU et notre politique de confidentialité.
      </Text>
    </ScrollView>
  );
}
