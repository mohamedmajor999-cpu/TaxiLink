import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';

interface Props {
  email: string;
  resendSent: boolean;
  resendLoading: boolean;
  onResend: () => void;
}

export function RegisterSuccess(props: Props) {
  return (
    <ScrollView className="flex-1 bg-bgsoft" contentContainerClassName="grow justify-center items-center p-6">
      <View className="w-24 h-24 rounded-full bg-warm-100 items-center justify-center mb-6">
        <Text style={{ fontSize: 44 }}>📬</Text>
      </View>
      <Text className="text-4xl font-extrabold text-secondary text-center mb-2">Vérifie ta boîte mail</Text>
      <Text className="text-muted text-center text-base mb-1">On a envoyé un lien de confirmation à</Text>
      <Text className="font-bold text-secondary text-center text-base mb-8" numberOfLines={1}>{props.email}</Text>

      <View className="bg-warm-100 rounded-2xl p-5 mb-4 w-full gap-2">
        <Text className="font-bold text-warm-800 text-base">⚠ Pas reçu d'email ?</Text>
        <Text className="text-warm-800 text-sm leading-5">Vérifie tes spams ou courriers indésirables. L'expéditeur est TaxiLink.</Text>
      </View>

      {props.resendSent ? (
        <View className="bg-success-soft rounded-xl px-4 py-4 w-full mb-3">
          <Text className="text-success font-semibold text-center text-base">✓ Nouvel email envoyé. Vérifie aussi tes spams.</Text>
        </View>
      ) : (
        <Pressable onPress={props.onResend} disabled={props.resendLoading} className="h-14 rounded-xl border-2 border-line bg-paper items-center justify-center w-full mb-3">
          {props.resendLoading ? <ActivityIndicator color="#1A1A1A" /> : <Text className="font-bold text-secondary text-base">Renvoyer l'email</Text>}
        </Pressable>
      )}

      <Pressable onPress={() => router.replace('/login')} className="h-14 rounded-xl bg-primary items-center justify-center w-full">
        <Text className="font-bold text-secondary text-base">J'ai confirmé, me connecter</Text>
      </Pressable>
    </ScrollView>
  );
}
