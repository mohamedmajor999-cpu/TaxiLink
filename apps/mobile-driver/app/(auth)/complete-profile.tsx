import { Text, View, Pressable, ScrollView } from 'react-native'
import { router } from 'expo-router'

// Cet ecran sera utilise apres un signup via OAuth Google (Sem 11), qui ne
// fournit ni telephone ni departement. Tant que Google n'est pas cable, on
// ne l'atteint jamais — c'est juste un stub pour ne pas casser la navigation.
export default function CompleteProfileScreen() {
  return (
    <ScrollView className="flex-1 bg-bgsoft" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
      <View className="bg-paper rounded-2xl p-6 max-w-md mx-auto w-full" style={{ gap: 16 }}>
        <Text className="text-2xl font-sans-extrabold text-secondary">
          Compléter le profil
        </Text>
        <Text className="text-muted">
          Ecran utilise apres un signup Google (livre en Sem 11 avec expo-auth-session).
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
