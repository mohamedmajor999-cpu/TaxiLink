'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Icon } from '@/components/ui/Icon'
import { useForgotPasswordForm } from './useForgotPasswordForm'

export function ForgotPasswordForm() {
  const { email, setEmail, loading, sent, error, handleSubmit } = useForgotPasswordForm()

  return (
    <div className="min-h-screen bg-bgsoft flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center mb-6" aria-label="TaxiLink Pro">
            <Image src="/brand/logo-primary.svg" alt="TaxiLink Pro" width={224} height={40} priority className="h-10 w-auto" />
          </Link>
          <h1 className="text-2xl font-black text-secondary">Mot de passe oublié</h1>
          <p className="text-muted mt-2 text-sm">
            {sent ? 'Vérifiez votre boîte mail' : 'Saisissez votre email pour recevoir un lien de réinitialisation'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-soft p-8">
          {sent ? (
            <div className="text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <Icon name="mark_email_read" size={32} className="text-green-600" />
              </div>
              <div>
                <p className="font-bold text-secondary">Email envoyé !</p>
                <p className="text-sm text-muted mt-1">
                  Un lien de réinitialisation a été envoyé à <strong>{email}</strong>.
                  Vérifiez vos spams si vous ne le trouvez pas.
                </p>
              </div>
              <Link href="/auth/login"
                className="block w-full h-12 rounded-xl bg-primary font-bold text-secondary text-sm flex items-center justify-center gap-2 hover:bg-yellow-400 transition-colors btn-ripple">
                <Icon name="arrow_back" size={16} />
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">Adresse email</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="marc@exemple.fr" required
                  className="w-full h-12 px-4 rounded-xl border-2 border-line focus:border-accent focus:outline-none text-sm font-semibold transition-colors"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                  <Icon name="error" size={16} className="text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full h-12 rounded-xl bg-primary font-bold text-secondary flex items-center justify-center gap-2 hover:bg-yellow-400 transition-colors btn-ripple disabled:opacity-60">
                {loading
                  ? <><Icon name="sync" size={18} className="animate-spin" />Envoi en cours...</>
                  : <><Icon name="send" size={18} />Envoyer le lien</>}
              </button>

              <p className="text-center text-sm text-muted">
                <Link href="/auth/login" className="font-semibold text-accent hover:underline">Retour à la connexion</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
