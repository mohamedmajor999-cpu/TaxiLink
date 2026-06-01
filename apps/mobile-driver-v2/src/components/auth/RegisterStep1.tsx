import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

interface Props {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  showPw: boolean;
  togglePw: () => void;
  showConfirmPw: boolean;
  toggleConfirmPw: () => void;
  loading: boolean;
  onNext: () => void;
}

export function RegisterStep1(props: Props) {
  const passwordHint = props.password.length > 0 && props.password.length < 8 ? '8 caractères min' : null;
  const confirmHint = props.confirmPassword.length > 0 && props.confirmPassword !== props.password
    ? 'Les mots de passe ne correspondent pas'
    : null;

  return (
    <View className="gap-5">
      <View>
        <Text className="text-sm font-bold text-secondary uppercase mb-2 tracking-widest">Email</Text>
        <TextInput
          value={props.email}
          onChangeText={props.setEmail}
          placeholder="marc@exemple.fr"
          placeholderTextColor="#9CA3AF"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          className="h-14 px-5 rounded-xl border-2 border-line bg-paper text-base font-semibold text-secondary"
        />
      </View>

      <PasswordField
        label="Mot de passe"
        value={props.password}
        onChange={props.setPassword}
        show={props.showPw}
        toggle={props.togglePw}
        placeholder="8 caractères minimum"
        hint={passwordHint}
      />

      <PasswordField
        label="Confirmer le mot de passe"
        value={props.confirmPassword}
        onChange={props.setConfirmPassword}
        show={props.showConfirmPw}
        toggle={props.toggleConfirmPw}
        placeholder="Retapez votre mot de passe"
        hint={confirmHint}
      />

      <Pressable
        onPress={props.onNext}
        disabled={props.loading}
        className={`h-14 rounded-xl bg-primary items-center justify-center ${props.loading ? 'opacity-60' : ''}`}
      >
        {props.loading ? <ActivityIndicator color="#1A1A1A" /> : <Text className="font-bold text-secondary text-base">Continuer →</Text>}
      </Pressable>
    </View>
  );
}

function PasswordField(p: { label: string; value: string; onChange: (v: string) => void; show: boolean; toggle: () => void; placeholder: string; hint: string | null }) {
  return (
    <View>
      <Text className="text-sm font-bold text-secondary uppercase mb-2 tracking-widest">{p.label}</Text>
      <View className="flex-row items-center">
        <TextInput
          value={p.value}
          onChangeText={p.onChange}
          secureTextEntry={!p.show}
          placeholder={p.placeholder}
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
          autoComplete="password-new"
          className="flex-1 h-14 px-5 pr-14 rounded-xl border-2 border-line bg-paper text-base font-semibold text-secondary"
        />
        <Pressable onPress={p.toggle} className="absolute right-3 h-14 w-10 items-center justify-center" hitSlop={8}>
          <Text className="text-muted text-xl">{p.show ? '🙈' : '👁'}</Text>
        </Pressable>
      </View>
      {p.hint && <Text className="mt-1.5 text-sm text-danger font-semibold">{p.hint}</Text>}
    </View>
  );
}
