'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Icon } from '@/components/ui/Icon'
import { AuthBrandPanel } from './AuthBrandPanel'
import { useRegisterForm } from './useRegisterForm'
import { RegisterStep1 } from './RegisterStep1'
import { RegisterStep2 } from './RegisterStep2'

export function RegisterForm() {
  const form = useRegisterForm()

  if (form.success) {
    return (
      <div className="min-h-screen bg-bgsoft lg:grid lg:grid-cols-2">
        <AuthBrandPanel
          eyebrow="Une dernière étape"
          title={<>Confirme ton<br />adresse email.</>}
          lead="On vient de t'envoyer un lien de confirmation. Clique dessus pour activer ton compte."
        />
        <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
              <Icon name="mark_email_unread" size={40} className="text-amber-600" />
            </div>
            <h2 className="text-3xl font-black text-secondary mb-3">Vérifie ta boîte mail</h2>
            <p className="text-muted mb-2">On a envoyé un lien de confirmation à</p>
            <p className="font-bold text-secondary mb-6 break-all">{form.email}</p>
          </div>

          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 mb-6 text-sm text-amber-900 space-y-2">
            <div className="flex items-start gap-2">
              <Icon name="warning" size={18} className="mt-0.5 flex-shrink-0" />
              <p><span className="font-bold">Pas reçu d&apos;email ?</span> Vérifie tes <span className="font-semibold">spams</span> ou <span className="font-semibold">courriers indésirables</span>. L&apos;expéditeur est <span className="font-semibold">TaxiLink</span>.</p>
            </div>
          </div>

          {form.resendSent ? (
            <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-200 flex items-center gap-2 text-green-700 text-sm font-semibold">
              <Icon name="check_circle" size={16} />Nouvel email envoyé. Vérifie aussi tes spams.
            </div>
          ) : (
            <button type="button" onClick={form.handleResend} disabled={form.resendLoading}
              className="w-full h-12 rounded-xl border-2 border-line font-bold text-secondary text-sm flex items-center justify-center gap-2 hover:bg-white transition-colors mb-3 disabled:opacity-60">
              {form.resendLoading ? <><Icon name="sync" size={18} className="animate-spin" />Envoi...</> : <><Icon name="send" size={18} />Renvoyer l&apos;email</>}
            </button>
          )}

          <Link href="/auth/login"
            className="w-full h-12 rounded-xl bg-primary font-bold text-secondary text-sm flex items-center justify-center gap-2 hover:bg-yellow-400 transition-colors">
            <Icon name="login" size={18} />J&apos;ai confirmé, me connecter
          </Link>

          {form.error && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-red-600 text-sm">
              <Icon name="error" size={16} />{form.error}
            </div>
          )}
        </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bgsoft lg:grid lg:grid-cols-2">
      <AuthBrandPanel
        eyebrow="Inscription gratuite"
        title={<>Rejoignez des<br />chauffeurs<br />engagés.</>}
        lead="Création de compte en 2 minutes. Aucun engagement, aucune carte bancaire."
      />
      <div className="flex items-center justify-center px-4 py-12 lg:py-8">
      <div className="w-full max-w-md">

        {/* Logo + titre */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center mb-6 lg:hidden" aria-label="TaxiLink Pro">
            <Image src="/brand/logo-primary.svg" alt="TaxiLink Pro" width={224} height={40} priority className="h-10 w-auto" />
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
    </div>
  )
}
