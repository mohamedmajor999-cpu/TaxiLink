import { ScrollView, Text, View } from 'react-native';
import { Link } from 'expo-router';

import { Logo } from '@/components/brand/Logo';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { RegisterStep1 } from '@/components/auth/RegisterStep1';
import { RegisterStep2 } from '@/components/auth/RegisterStep2';
import { RegisterSuccess } from '@/components/auth/RegisterSuccess';
import { useRegisterForm } from './_useRegisterForm';

export default function RegisterScreen() {
  const f = useRegisterForm();

  if (f.success) {
    return <RegisterSuccess email={f.email} resendSent={f.resendSent} resendLoading={f.resendLoading} onResend={f.handleResend} />;
  }

  return (
    <ScrollView
      className="flex-1 bg-bgsoft"
      contentContainerClassName="grow justify-center px-6 py-12"
      keyboardShouldPersistTaps="handled"
    >
      <Logo width={240} height={48} className="self-center mb-10" />

      <Text className="text-4xl font-extrabold text-secondary text-center mb-2">Créer un compte</Text>
      <Text className="text-muted text-center text-base mb-8">Gratuit, sans engagement</Text>

      <View className="flex-row gap-2 mb-5">
        <View className={`flex-1 h-2 rounded-full ${f.step >= 1 ? 'bg-primary' : 'bg-line'}`} />
        <View className={`flex-1 h-2 rounded-full ${f.step >= 2 ? 'bg-primary' : 'bg-line'}`} />
      </View>

      <View className="bg-paper rounded-2xl p-6 gap-5 shadow-sm">
        {f.error && (
          <View className="p-4 rounded-xl bg-danger-soft border border-danger">
            <Text className="text-danger text-base">{f.error}</Text>
          </View>
        )}

        {f.step === 1 ? (
          <>
            <RegisterStep1
              email={f.email} setEmail={f.setEmail}
              password={f.password} setPassword={f.setPassword}
              confirmPassword={f.confirmPassword} setConfirmPassword={f.setConfirmPassword}
              showPw={f.showPw} togglePw={f.togglePw}
              showConfirmPw={f.showConfirmPw} toggleConfirmPw={f.toggleConfirmPw}
              loading={false} onNext={f.handleNextStep}
            />
            <View className="flex-row items-center gap-3">
              <View className="flex-1 h-px bg-line" />
              <Text className="text-sm text-muted font-semibold">ou</Text>
              <View className="flex-1 h-px bg-line" />
            </View>
            <GoogleSignInButton loading={f.googleLoading} onPress={f.handleGoogle} label="S'inscrire avec Google" />
          </>
        ) : (
          <RegisterStep2
            firstName={f.firstName} setFirstName={f.setFirstName}
            lastName={f.lastName} setLastName={f.setLastName}
            phone={f.phone} setPhone={f.setPhone}
            department={f.department} setDepartment={f.setDepartment}
            departmentInfo={f.departmentInfo}
            loading={f.loading} onBack={() => f.setStep(1)} onSubmit={f.handleSubmit}
          />
        )}
      </View>

      <View className="flex-row justify-center mt-8">
        <Text className="text-base text-muted">Déjà un compte ? </Text>
        <Link href="/login">
          <Text className="font-bold text-secondary text-base">Se connecter</Text>
        </Link>
      </View>
    </ScrollView>
  );
}
