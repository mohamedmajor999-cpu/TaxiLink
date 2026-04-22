'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Icon } from '@/components/ui/Icon'
import { useLoginForm } from './useLoginForm'

export function LoginForm() {
  const { email, setEmail, password, setPassword, showPw, setShowPw, loading, error, handleSubmit } = useLoginForm()

  return (
    <div className="min-h-screen bg-bgsoft flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center mb-6" aria-label="TaxiLink Pro">
            <Image src="/brand/logo-primary.svg" alt="TaxiLink Pro" width={224} height={40} priority className="h-10 w-auto" />
          </Link>
          <h1 className="text-3xl font-black text-secondary mb-2">Bon retour !</h1>
          <p className="text-muted">Connectez-vous à votre compte</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-8">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-red-600 text-sm">
              <Icon name="error" size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="marc@taxilink.fr"
                className="w-full h-12 px-4 rounded-xl border-2 border-line focus:border-accent focus:outline-none text-sm font-semibold transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="••••••••"
                  className="w-full h-12 px-4 pr-12 rounded-xl border-2 border-line focus:border-accent focus:outline-none text-sm font-semibold transition-colors"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-secondary" aria-label="Afficher le mot de passe">
                  <Icon name={showPw ? 'visibility_off' : 'visibility'} size={18} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Link href="/auth/forgot-password" className="text-xs text-accent font-semibold hover:underline">Mot de passe oublié ?</Link>
            </div>

            <button type="submit" disabled={loading}
              className="w-full h-12 rounded-xl bg-primary font-bold text-secondary text-sm flex items-center justify-center gap-2 hover:bg-yellow-400 transition-colors btn-ripple disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? <><Icon name="sync" size={18} className="animate-spin" />Connexion...</> : <><Icon name="login" size={18} />Se connecter</>}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-line text-center">
            <p className="text-sm text-muted">
              Pas encore de compte ?{' '}
              <Link href="/auth/register" className="font-bold text-secondary hover:text-primary transition-colors">
                Créer un compte gratuit
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-muted mt-6">
          En vous connectant, vous acceptez nos{' '}
          <Link href="#" className="underline">CGU</Link> et notre{' '}
          <Link href="#" className="underline">politique de confidentialité</Link>.
        </p>
      </div>
    </div>
  )
}
