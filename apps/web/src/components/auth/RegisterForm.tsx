'use client'

import Link from 'next/link'
import { Icon } from '@/components/ui/Icon'
import { useRegisterForm } from './useRegisterForm'

export function RegisterForm() {
  const {
    role, setRole, fullName, setFullName,
    email, setEmail, phone, setPhone,
    proNumber, setProNumber, password, setPassword,
    showPw, togglePw, loading, error, success, handleSubmit,
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

        <div className="bg-white rounded-2xl shadow-card p-8">
          <div className="grid grid-cols-2 gap-2 mb-6">
            {([
              { r: 'driver' as const, icon: 'directions_car', label: 'Je suis chauffeur',  desc: 'Taxi / VTC' },
              { r: 'client' as const, icon: 'person',         label: 'Je cherche un taxi', desc: 'Passager / Établissement' },
            ]).map(({ r, icon, label, desc }) => (
              <button key={r} type="button" onClick={() => setRole(r)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${role === r ? 'border-primary bg-primary/10' : 'border-line hover:border-gray-300'}`}>
                <Icon name={icon} size={20} className={role === r ? 'text-secondary' : 'text-muted'} />
                <div className={`text-sm font-bold mt-2 ${role === r ? 'text-secondary' : 'text-muted'}`}>{label}</div>
                <div className="text-[10px] text-muted">{desc}</div>
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-red-600 text-sm">
              <Icon name="error" size={16} />{error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">Nom complet</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Marc Fontaine"
                className="w-full h-12 px-4 rounded-xl border-2 border-line focus:border-accent focus:outline-none text-sm font-semibold transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="marc@exemple.fr"
                className="w-full h-12 px-4 rounded-xl border-2 border-line focus:border-accent focus:outline-none text-sm font-semibold transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">Téléphone</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+33 6 12 34 56 78"
                className="w-full h-12 px-4 rounded-xl border-2 border-line focus:border-accent focus:outline-none text-sm font-semibold transition-colors" />
            </div>
            {role === 'driver' && (
              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">N° carte professionnelle</label>
                <input type="text" value={proNumber} onChange={e => setProNumber(e.target.value)} required placeholder="VTC-2024-XXXXXX"
                  className="w-full h-12 px-4 rounded-xl border-2 border-line focus:border-accent focus:outline-none text-sm font-semibold transition-colors" />
              </div>
            )}
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

            <button type="submit" disabled={loading}
              className="w-full h-12 rounded-xl bg-primary font-bold text-secondary text-sm flex items-center justify-center gap-2 hover:bg-yellow-400 transition-colors btn-ripple disabled:opacity-60">
              {loading
                ? <><Icon name="sync" size={18} className="animate-spin" />Création...</>
                : <><Icon name="person_add" size={18} />Créer mon compte gratuit</>}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-line text-center">
            <p className="text-sm text-muted">Déjà un compte ?{' '}
              <Link href="/auth/login" className="font-bold text-secondary hover:text-primary transition-colors">Se connecter</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
