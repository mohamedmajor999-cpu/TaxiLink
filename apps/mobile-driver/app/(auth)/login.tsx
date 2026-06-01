import { Text, View, TextInput, Pressable, ScrollView, ActivityIndicator } from 'react-native'
import { Link } from 'expo-router'

import { useLoginForm } from './useLoginForm'

// Port direct du LoginForm web (apps/web/src/components/auth/LoginForm.tsx).
// UI 1 colonne (pas d'AuthBrandPanel desktop), tout le reste fidele.
export default function LoginScreen() {
  const {
    email, setEmail,
    password, setPassword,
    showPw, togglePw,
    loading, googleLoading,
    resendLoading, resendSent,
    error, needsConfirmation,
    handleSubmit, handleGoogle, handleResend,
  } = useLoginForm()

  return (
    <ScrollView
      className="flex-1 bg-bgsoft"
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 48 }}
      keyboardShouldPersistTaps="handled"
    >
      <View className="w-full max-w-md mx-auto">
        {/* Logo + titre */}
        <View className="items-center mb-8">
          <View className="bg-primary rounded-2xl px-5 py-2.5 mb-6">
            <Text className="text-2xl font-sans-extrabold text-secondary tracking-tight">
              TaxiLink
            </Text>
          </View>
          <Text className="text-3xl font-sans-extrabold text-secondary mb-2">
            Bon retour !
          </Text>
          <Text className="text-muted">Connectez-vous a votre compte</Text>
        </View>

        {/* Card formulaire */}
        <View className="bg-paper rounded-2xl shadow-card p-6" style={{ gap: 16 }}>
          {/* Erreur generique */}
          {error && !needsConfirmation && (
            <View className="p-3 rounded-xl bg-danger-soft border border-danger">
              <Text className="text-danger text-sm">{error}</Text>
            </View>
          )}

          {/* Bloc email non confirme */}
          {needsConfirmation && (
            <View className="p-4 rounded-xl bg-warm-100 border border-warm-300" style={{ gap: 12 }}>
              <View>
                <Text className="font-sans-bold text-warm-800 mb-1">Email non confirme</Text>
                <Text className="text-warm-800 text-sm">
                  Ouvre l&apos;email envoye a{' '}
                  <Text className="font-sans-semibold">{email}</Text> et clique sur le lien.
                  Pense a verifier tes spams.
                </Text>
              </View>
              {resendSent ? (
                <Text className="text-success font-sans-semibold text-sm">
                  ✓ Nouvel email envoye.
                </Text>
              ) : (
                <Pressable
                  onPress={handleResend}
                  disabled={resendLoading}
                  className="h-10 rounded-lg border-2 border-warm-300 bg-paper items-center justify-center active:opacity-70"
                >
                  {resendLoading ? (
                    <ActivityIndicator color="#5F5E5A" />
                  ) : (
                    <Text className="font-sans-bold text-warm-800 text-sm">
                      Renvoyer l&apos;email de confirmation
                    </Text>
                  )}
                </Pressable>
              )}
            </View>
          )}

          {/* Email */}
          <View>
            <Text className="text-xs font-sans-bold text-secondary uppercase mb-1.5" style={{ letterSpacing: 1 }}>
              Email
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="marc@taxilink.fr"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              className="h-12 px-4 rounded-xl border-2 border-line bg-paper text-sm font-sans-semibold text-secondary"
            />
          </View>

          {/* Password */}
          <View>
            <Text className="text-xs font-sans-bold text-secondary uppercase mb-1.5" style={{ letterSpacing: 1 }}>
              Mot de passe
            </Text>
            <View className="flex-row items-center">
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPw}
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                autoComplete="password"
                className="flex-1 h-12 px-4 pr-12 rounded-xl border-2 border-line bg-paper text-sm font-sans-semibold text-secondary"
              />
              <Pressable
                onPress={togglePw}
                className="absolute right-3 h-12 w-8 items-center justify-center"
                hitSlop={8}
              >
                <Text className="text-muted text-base">{showPw ? '🙈' : '👁'}</Text>
              </Pressable>
            </View>
          </View>

          {/* Lien Mot de passe oublie */}
          <View className="items-end -mt-1">
            <Link href="/forgot-password" asChild>
              <Pressable hitSlop={6}>
                <Text className="text-xs text-accent font-sans-semibold">
                  Mot de passe oublie ?
                </Text>
              </Pressable>
            </Link>
          </View>

          {/* CTA principal */}
          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            className="h-12 rounded-xl bg-primary items-center justify-center active:opacity-80"
            style={loading ? { opacity: 0.6 } : undefined}
          >
            {loading ? (
              <ActivityIndicator color="#1A1A1A" />
            ) : (
              <Text className="font-sans-bold text-secondary text-sm">Se connecter</Text>
            )}
          </Pressable>

          {/* Separateur ou */}
          <View className="flex-row items-center" style={{ gap: 12 }}>
            <View className="flex-1 h-px bg-line" />
            <Text className="text-xs text-muted font-sans-semibold">ou</Text>
            <View className="flex-1 h-px bg-line" />
          </View>

          {/* CTA Google */}
          <Pressable
            onPress={handleGoogle}
            disabled={googleLoading}
            className="h-12 rounded-xl border-2 border-line bg-paper flex-row items-center justify-center active:opacity-70"
            style={{ gap: 12 }}
          >
            {googleLoading ? (
              <ActivityIndicator color="#1A1A1A" />
            ) : (
              <Text className="font-sans-bold text-secondary text-sm">G  Continuer avec Google</Text>
            )}
          </Pressable>
        </View>

        {/* Footer creation compte */}
        <View className="items-center mt-6">
          <Text className="text-sm text-muted">
            Pas encore de compte ?{' '}
            <Link href="/register">
              <Text className="font-sans-bold text-secondary">Creer un compte gratuit</Text>
            </Link>
          </Text>
        </View>

        {/* Mention CGU */}
        <Text className="text-center text-xs text-muted mt-6 px-4">
          En vous connectant, vous acceptez nos CGU et notre politique de confidentialite.
        </Text>
      </View>
    </ScrollView>
  )
}
