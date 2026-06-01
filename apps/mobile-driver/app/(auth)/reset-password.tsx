import { Text, View, Pressable, ScrollView } from 'react-native'
import { router } from 'expo-router'

// Le reset password depuis mobile passe d'abord par le lien email -> page web
// taxilink.fr/auth/reset-password (qui gere l'echange de code). Ensuite l'user
// peut se reconnecter dans l'app mobile avec le nouveau mot de passe.
// A terme : deep-link taxilink-driver://auth/reset?code=... pour rester dans l'app.
export default function ResetPasswordScreen() {
  return (
    <ScrollView className="flex-1 bg-bgsoft" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
      <View className="bg-paper rounded-2xl p-6 max-w-md mx-auto w-full" style={{ gap: 16 }}>
        <Text className="text-2xl font-sans-extrabold text-secondary">
          Reset via email
        </Text>
        <Text className="text-muted">
          Le lien de reinitialisation envoye par email t’amenera sur le site web
          pour choisir un nouveau mot de passe. Tu pourras ensuite te reconnecter
          dans l’app avec.
        </Text>
        <Pressable
          onPress={() => router.replace('/login')}
          className="h-12 rounded-xl bg-primary items-center justify-center active:opacity-80"
        >
          <Text className="font-sans-bold text-secondary">Retour au login</Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}
