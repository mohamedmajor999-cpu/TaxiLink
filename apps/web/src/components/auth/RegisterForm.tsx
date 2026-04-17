'use client'

import Link from 'next/link'
import { Icon } from '@/components/ui/Icon'
import { useRegisterForm } from './useRegisterForm'
import { RegisterStep1 } from './RegisterStep1'
import { RegisterStep2 } from './RegisterStep2'

export function RegisterForm() {
  const form = useRegisterForm()

  if (form.success) {
    return (
      <div className="min-h-screen bg-bgsoft flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <Icon name="check_circle" size={40} className="text-green-500" />
          </div>
          <h2 className="text-3xl font-black text-secondary mb-3">Compte créé !</h2>
          <p className="text-muted mb-8">Vérifiez votre email pour confirmer votre inscription puis connectez-vous.</p>
          <Link href="/auth/login"
            className="inline-flex h-12 px-8 rounded-xl bg-primary font-bold text-secondary text-sm items-center gap-2 hover:bg-yellow-400 transition-colors">
            <Icon name="login" size={18} />Se connecter
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bgsoft flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo + titre */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-2xl font-black text-secondary">T</div>
            <span className="text-xl font-black text-secondary">TaxiLink <span className="text-primary">Pro</span></span>
          </Link>
          <h1 className="text-3xl font-black text-secondary mb-2">Créer un compte</h1>
          <p className="text-muted">Gratuit, sans engagement</p>
        </div>

        {/* Indicateur d'étapes */}
        <div className="flex items-center gap-2 mb-6">
          <div className={`flex-1 h-1.5 rounded-full transition-colors ${form.step >= 1 ? 'bg-primary' : 'bg-line'}`} />
          <div className={`flex-1 h-1.5 rounded-full transition-colors ${form.step >= 2 ? 'bg-primary' : 'bg-line'}`} />
        </div>

        <div className="bg-white rounded-2xl shadow-card p-8 space-y-4">
          {form.error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-red-600 text-sm">
              <Icon name="error" size={16} />{form.error}
            </div>
          )}

          {form.step === 1 && (
            <RegisterStep1
              email={form.email}             setEmail={form.setEmail}
              password={form.password}       setPassword={form.setPassword}
              confirmPassword={form.confirmPassword} setConfirmPassword={form.setConfirmPassword}
              showPw={form.showPw}           togglePw={form.togglePw}
              showConfirmPw={form.showConfirmPw} toggleConfirmPw={form.toggleConfirmPw}
              googleLoading={form.googleLoading}
              step1Loading={form.step1Loading}
              passwordStrengthInfo={form.passwordStrengthInfo}
              confirmBorderClass={form.confirmBorderClass}
              onSubmit={form.handleNextStep}
              onGoogle={form.handleGoogle}
            />
          )}

          {form.step === 2 && (
            <RegisterStep2
              firstName={form.firstName}     setFirstName={form.setFirstName}
              lastName={form.lastName}       setLastName={form.setLastName}
              phone={form.phone}             setPhone={form.setPhone}
              department={form.department}   setDepartment={form.setDepartment}
              loading={form.loading}
              onSubmit={form.handleSubmit}
              onBack={() => form.setStep(1)}
            />
          )}
        </div>
      </div>
    </div>
  )
}
