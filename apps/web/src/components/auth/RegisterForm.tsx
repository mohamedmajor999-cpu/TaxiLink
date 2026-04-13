'use client'

import Link from 'next/link'
import { Icon } from '@/components/ui/Icon'
import { useRegisterForm } from './useRegisterForm'

export function RegisterForm() {
  const {
    firstName, setFirstName, lastName, setLastName,
    email, setEmail, phone, setPhone,
    department, setDepartment,
    password, setPassword, confirmPassword, setConfirmPassword,
    showPw, togglePw, showConfirmPw, toggleConfirmPw,
    loading, googleLoading, error, success,
    handleSubmit, handleGoogle,
  } = useRegisterForm()

  if (success) {
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
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-2xl font-black text-secondary">T</div>
            <span className="text-xl font-black text-secondary">TaxiLink <span className="text-primary">Pro</span></span>
          </Link>
          <h1 className="text-3xl font-black text-secondary mb-2">Créer un compte</h1>
          <p className="text-muted">Gratuit, sans engagement</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-8 space-y-4">

          {/* Bouton Google */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading || loading}
            className="w-full h-12 rounded-xl border-2 border-line font-bold text-secondary text-sm flex items-center justify-center gap-3 hover:bg-bgsoft transition-colors disabled:opacity-60"
          >
            {googleLoading ? (
              <Icon name="sync" size={18} className="animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            Continuer avec Google
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-line" />
            <span className="text-xs text-muted font-semibold">ou</span>
            <div className="flex-1 h-px bg-line" />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-red-600 text-sm">
              <Icon name="error" size={16} />{error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Prénom + Nom */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">Prénom</label>
                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required
                  placeholder="Marc"
                  className="w-full h-12 px-4 rounded-xl border-2 border-line focus:border-accent focus:outline-none text-sm font-semibold transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">Nom</label>
                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required
                  placeholder="Fontaine"
                  className="w-full h-12 px-4 rounded-xl border-2 border-line focus:border-accent focus:outline-none text-sm font-semibold transition-colors" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="marc@exemple.fr"
                className="w-full h-12 px-4 rounded-xl border-2 border-line focus:border-accent focus:outline-none text-sm font-semibold transition-colors" />
            </div>

            {/* Téléphone + Département */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">Téléphone</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="0601020304"
                  className="w-full h-12 px-4 rounded-xl border-2 border-line focus:border-accent focus:outline-none text-sm font-semibold transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">Département</label>
                <input type="text" value={department} onChange={e => setDepartment(e.target.value)}
                  placeholder="13"
                  maxLength={3}
                  className="w-full h-12 px-4 rounded-xl border-2 border-line focus:border-accent focus:outline-none text-sm font-semibold transition-colors" />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">Mot de passe</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
                  placeholder="8 caractères minimum"
                  className="w-full h-12 px-4 pr-12 rounded-xl border-2 border-line focus:border-accent focus:outline-none text-sm font-semibold transition-colors" />
                <button type="button" onClick={togglePw} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" aria-label="Afficher">
                  <Icon name={showPw ? 'visibility_off' : 'visibility'} size={18} />
                </button>
              </div>
            </div>

            {/* Confirmer le mot de passe */}
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">Confirmer le mot de passe</label>
              <div className="relative">
                <input type={showConfirmPw ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                  placeholder="Retapez votre mot de passe"
                  className={`w-full h-12 px-4 pr-12 rounded-xl border-2 focus:outline-none text-sm font-semibold transition-colors ${
                    confirmPassword && password !== confirmPassword
                      ? 'border-red-300 focus:border-red-400'
                      : confirmPassword && password === confirmPassword
                      ? 'border-green-300 focus:border-green-400'
                      : 'border-line focus:border-accent'
                  }`} />
                <button type="button" onClick={toggleConfirmPw} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" aria-label="Afficher">
                  <Icon name={showConfirmPw ? 'visibility_off' : 'visibility'} size={18} />
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading || googleLoading}
              className="w-full h-12 rounded-xl bg-primary font-bold text-secondary text-sm flex items-center justify-center gap-2 hover:bg-yellow-400 transition-colors btn-ripple disabled:opacity-60">
              {loading
                ? <><Icon name="sync" size={18} className="animate-spin" />Création...</>
                : <><Icon name="person_add" size={18} />Créer mon compte gratuit</>}
            </button>
          </form>

          <div className="pt-2 border-t border-line text-center">
            <p className="text-sm text-muted">Déjà un compte ?{' '}
              <Link href="/auth/login" className="font-bold text-secondary hover:text-primary transition-colors">Se connecter</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
