import { useState } from 'react'
import { Text, View, TextInput, Pressable, ScrollView, ActivityIndicator } from 'react-native'
import { Link, router } from 'expo-router'

import { authService, reportError } from '@taxilink/services'

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!email) return
    setLoading(true)
    setError(null)
    try {
      // redirectTo : pour l'instant le lien email pointe vers le site web qui
      // gere le reset. Plus tard on cablera un deep-link taxilink-driver://auth/reset
      await authService.resetPassword(email.trim().toLowerCase(), 'https://taxilink.fr/auth/reset-password')
      setSent(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Echec de l’envoi.'
      setError(msg)
      reportError(err, { tags: { phase: 'forgot-password' } })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-bgsoft"
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
      keyboardShouldPersistTaps="handled"
    >
      <View className="bg-paper rounded-2xl shadow-card p-6 max-w-md mx-auto w-full" style={{ gap: 16 }}>
        <View>
          <Text className="text-2xl font-sans-extrabold text-secondary">Mot de passe oublie</Text>
          <Text className="text-muted mt-1">
            On t’envoie un lien pour en choisir un nouveau.
          </Text>
        </View>

        {error && (
          <View className="p-3 rounded-xl bg-danger-soft border border-danger">
            <Text className="text-danger text-sm">{error}</Text>
          </View>
        )}

        {sent ? (
          <View className="p-4 rounded-xl bg-success-soft border border-success">
            <Text className="text-success font-sans-bold mb-1">Email envoye ✓</Text>
            <Text className="text-secondary text-sm">
              Verifie ta boite ({email}) et les spams. Le lien expire dans 1 heure.
            </Text>
          </View>
        ) : (
          <>
            <View>
              <Text className="text-xs font-sans-bold text-secondary uppercase mb-1.5" style={{ letterSpacing: 1 }}>
                Email
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="marc@exemple.fr"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                className="h-12 px-4 rounded-xl border-2 border-line bg-paper text-sm font-sans-semibold text-secondary"
              />
            </View>

            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              className="h-12 rounded-xl bg-primary items-center justify-center active:opacity-80"
              style={loading ? { opacity: 0.6 } : undefined}
            >
              {loading ? (
                <ActivityIndicator color="#1A1A1A" />
              ) : (
                <Text className="font-sans-bold text-secondary text-sm">Envoyer le lien</Text>
              )}
            </Pressable>
          </>
        )}

        <View className="items-center mt-2">
          <Link href="/login" asChild>
            <Pressable hitSlop={8}>
              <Text className="text-sm text-muted">Retour au login</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </ScrollView>
  )
}
