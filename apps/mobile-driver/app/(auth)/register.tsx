import { Text, View, TextInput, Pressable, ScrollView, ActivityIndicator } from 'react-native'
import { Link, router } from 'expo-router'

import { useRegisterForm } from './useRegisterForm'

// Port direct du RegisterForm web (apps/web/src/components/auth/RegisterForm.tsx) :
// flux 2 etapes (1=email+pw, 2=identite+departement), puis ecran success.
export default function RegisterScreen() {
  const form = useRegisterForm()

  if (form.success) return <SuccessView form={form} />

  return (
    <ScrollView
      className="flex-1 bg-bgsoft"
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 48 }}
      keyboardShouldPersistTaps="handled"
    >
      <View className="w-full max-w-md mx-auto">
        <View className="items-center mb-8">
          <View className="bg-primary rounded-2xl px-5 py-2.5 mb-6">
            <Text className="text-2xl font-sans-extrabold text-secondary">TaxiLink</Text>
          </View>
          <Text className="text-3xl font-sans-extrabold text-secondary mb-2">
            Creer un compte
          </Text>
          <Text className="text-muted">Gratuit, sans engagement</Text>
        </View>

        {/* Indicateur d'etapes */}
        <View className="flex-row mb-4" style={{ gap: 8 }}>
          <View className={`flex-1 h-1.5 rounded-full ${form.step >= 1 ? 'bg-primary' : 'bg-line'}`} />
          <View className={`flex-1 h-1.5 rounded-full ${form.step >= 2 ? 'bg-primary' : 'bg-line'}`} />
        </View>

        <View className="bg-paper rounded-2xl shadow-card p-6" style={{ gap: 16 }}>
          {form.error && (
            <View className="p-3 rounded-xl bg-danger-soft border border-danger">
              <Text className="text-danger text-sm">{form.error}</Text>
            </View>
          )}

          {form.step === 1 ? <Step1 form={form} /> : <Step2 form={form} />}
        </View>

        <View className="items-center mt-6">
          <Text className="text-sm text-muted">
            Deja un compte ?{' '}
            <Link href="/login">
              <Text className="font-sans-bold text-secondary">Se connecter</Text>
            </Link>
          </Text>
        </View>
      </View>
    </ScrollView>
  )
}

// ---------- Step 1 : Email + password + confirm ----------

function Step1({ form }: { form: ReturnType<typeof useRegisterForm> }) {
  return (
    <View style={{ gap: 16 }}>
      <FieldEmail value={form.email} onChange={form.setEmail} placeholder="marc@exemple.fr" />

      <FieldPassword
        label="Mot de passe"
        value={form.password}
        onChange={form.setPassword}
        show={form.showPw}
        toggle={form.togglePw}
        placeholder="8 caracteres minimum"
        hint={form.password.length > 0 && form.password.length < 8 ? '8 caracteres min' : null}
      />

      <FieldPassword
        label="Confirmer le mot de passe"
        value={form.confirmPassword}
        onChange={form.setConfirmPassword}
        show={form.showConfirmPw}
        toggle={form.toggleConfirmPw}
        placeholder="Retapez votre mot de passe"
        hint={
          form.confirmPassword.length > 0 && form.confirmPassword !== form.password
            ? 'Les mots de passe ne correspondent pas'
            : null
        }
      />

      <Pressable
        onPress={form.handleNextStep}
        disabled={form.step1Loading}
        className="h-12 rounded-xl bg-primary items-center justify-center active:opacity-80"
        style={form.step1Loading ? { opacity: 0.6 } : undefined}
      >
        {form.step1Loading ? (
          <ActivityIndicator color="#1A1A1A" />
        ) : (
          <Text className="font-sans-bold text-secondary text-sm">Continuer →</Text>
        )}
      </Pressable>

      <View className="flex-row items-center" style={{ gap: 12 }}>
        <View className="flex-1 h-px bg-line" />
        <Text className="text-xs text-muted font-sans-semibold">ou</Text>
        <View className="flex-1 h-px bg-line" />
      </View>

      <Pressable
        onPress={form.handleGoogle}
        disabled={form.googleLoading}
        className="h-12 rounded-xl border-2 border-line bg-paper items-center justify-center active:opacity-70"
      >
        <Text className="font-sans-bold text-secondary text-sm">G  Continuer avec Google</Text>
      </Pressable>
    </View>
  )
}

// ---------- Step 2 : Identite + departement ----------

function Step2({ form }: { form: ReturnType<typeof useRegisterForm> }) {
  return (
    <View style={{ gap: 16 }}>
      <FieldText label="Nom" value={form.lastName} onChange={form.setLastName} placeholder="Fontaine" autoCapitalize="words" />
      <FieldText label="Prenom" value={form.firstName} onChange={form.setFirstName} placeholder="Marc" autoCapitalize="words" />
      <FieldText label="Telephone" value={form.phone} onChange={form.setPhone} placeholder="0601020304" keyboardType="phone-pad" />

      <View>
        <Text className="text-xs font-sans-bold text-secondary uppercase mb-1.5" style={{ letterSpacing: 1 }}>
          Departement
        </Text>
        <TextInput
          value={form.department}
          onChangeText={form.setDepartment}
          placeholder="13 (Bouches-du-Rhone), 75 (Paris)..."
          placeholderTextColor="#9CA3AF"
          maxLength={3}
          autoCapitalize="characters"
          className="h-12 px-4 rounded-xl border-2 border-line bg-paper text-sm font-sans-semibold text-secondary"
        />
        {form.department.length > 0 && (
          <Text className={`mt-1 text-xs font-sans-semibold ${form.departmentInfo ? 'text-success' : 'text-danger'}`}>
            {form.departmentInfo ? `✓ ${form.departmentInfo.name}` : 'Code non reconnu'}
          </Text>
        )}
      </View>

      <View className="flex-row" style={{ gap: 12 }}>
        <Pressable
          onPress={() => form.setStep(1)}
          className="flex-1 h-12 rounded-xl border-2 border-line bg-paper items-center justify-center active:opacity-70"
        >
          <Text className="font-sans-bold text-secondary text-sm">← Retour</Text>
        </Pressable>
        <Pressable
          onPress={form.handleSubmit}
          disabled={form.loading}
          className="flex-1 h-12 rounded-xl bg-primary items-center justify-center active:opacity-80"
          style={form.loading ? { opacity: 0.6 } : undefined}
        >
          {form.loading ? (
            <ActivityIndicator color="#1A1A1A" />
          ) : (
            <Text className="font-sans-bold text-secondary text-sm">Creer mon compte</Text>
          )}
        </Pressable>
      </View>
    </View>
  )
}

// ---------- Success view : email a confirmer ----------

function SuccessView({ form }: { form: ReturnType<typeof useRegisterForm> }) {
  return (
    <ScrollView className="flex-1 bg-bgsoft" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
      <View className="w-full max-w-md mx-auto items-center">
        <View className="w-20 h-20 rounded-full bg-warm-100 items-center justify-center mb-6">
          <Text style={{ fontSize: 40 }}>📬</Text>
        </View>
        <Text className="text-3xl font-sans-extrabold text-secondary mb-2 text-center">
          Verifie ta boite mail
        </Text>
        <Text className="text-muted mb-1 text-center">On a envoye un lien de confirmation a</Text>
        <Text className="font-sans-bold text-secondary mb-6 text-center" numberOfLines={1}>
          {form.email}
        </Text>

        <View className="bg-warm-100 rounded-2xl p-4 mb-6 w-full" style={{ gap: 8 }}>
          <Text className="font-sans-bold text-warm-800">
            ⚠ Pas recu d&apos;email ?
          </Text>
          <Text className="text-warm-800 text-sm">
            Verifie tes <Text className="font-sans-semibold">spams</Text> ou{' '}
            <Text className="font-sans-semibold">courriers indesirables</Text>.
            L&apos;expediteur est <Text className="font-sans-semibold">TaxiLink</Text>.
          </Text>
        </View>

        {form.resendSent ? (
          <View className="bg-success-soft rounded-xl px-4 py-3 w-full mb-3">
            <Text className="text-success font-sans-semibold text-center text-sm">
              ✓ Nouvel email envoye. Verifie aussi tes spams.
            </Text>
          </View>
        ) : (
          <Pressable
            onPress={form.handleResend}
            disabled={form.resendLoading}
            className="h-12 rounded-xl border-2 border-line bg-paper items-center justify-center w-full mb-3 active:opacity-70"
          >
            {form.resendLoading ? (
              <ActivityIndicator color="#1A1A1A" />
            ) : (
              <Text className="font-sans-bold text-secondary text-sm">Renvoyer l&apos;email</Text>
            )}
          </Pressable>
        )}

        <Pressable
          onPress={() => router.replace('/login')}
          className="h-12 rounded-xl bg-primary items-center justify-center w-full active:opacity-80"
        >
          <Text className="font-sans-bold text-secondary text-sm">
            J&apos;ai confirme, me connecter
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}

// ---------- Champs reutilisables ----------

function FieldEmail({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <View>
      <Text className="text-xs font-sans-bold text-secondary uppercase mb-1.5" style={{ letterSpacing: 1 }}>
        Email
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        className="h-12 px-4 rounded-xl border-2 border-line bg-paper text-sm font-sans-semibold text-secondary"
      />
    </View>
  )
}

function FieldText({ label, value, onChange, placeholder, autoCapitalize, keyboardType }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string;
  autoCapitalize?: 'none' | 'words' | 'sentences'; keyboardType?: 'default' | 'phone-pad'
}) {
  return (
    <View>
      <Text className="text-xs font-sans-bold text-secondary uppercase mb-1.5" style={{ letterSpacing: 1 }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        autoCapitalize={autoCapitalize ?? 'none'}
        autoCorrect={false}
        keyboardType={keyboardType ?? 'default'}
        className="h-12 px-4 rounded-xl border-2 border-line bg-paper text-sm font-sans-semibold text-secondary"
      />
    </View>
  )
}

function FieldPassword({ label, value, onChange, show, toggle, placeholder, hint }: {
  label: string; value: string; onChange: (v: string) => void; show: boolean; toggle: () => void;
  placeholder: string; hint: string | null
}) {
  return (
    <View>
      <Text className="text-xs font-sans-bold text-secondary uppercase mb-1.5" style={{ letterSpacing: 1 }}>
        {label}
      </Text>
      <View className="flex-row items-center">
        <TextInput
          value={value}
          onChangeText={onChange}
          secureTextEntry={!show}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
          autoComplete="password-new"
          className="flex-1 h-12 px-4 pr-12 rounded-xl border-2 border-line bg-paper text-sm font-sans-semibold text-secondary"
        />
        <Pressable onPress={toggle} className="absolute right-3 h-12 w-8 items-center justify-center" hitSlop={8}>
          <Text className="text-muted text-base">{show ? '🙈' : '👁'}</Text>
        </Pressable>
      </View>
      {hint && <Text className="mt-1 text-xs text-danger font-sans-semibold">{hint}</Text>}
    </View>
  )
}
