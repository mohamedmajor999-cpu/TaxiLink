'use client'

import Link from 'next/link'
import { Icon } from '@/components/ui/Icon'
import type { PasswordStrengthInfo } from './useRegisterForm'

interface Props {
  email:            string
  setEmail:         (v: string) => void
  password:         string
  setPassword:      (v: string) => void
  confirmPassword:  string
  setConfirmPassword: (v: string) => void
  showPw:           boolean
  togglePw:         () => void
  showConfirmPw:    boolean
  toggleConfirmPw:  () => void
  googleLoading:    boolean
  step1Loading:     boolean
  passwordStrengthInfo: PasswordStrengthInfo
  onSubmit:         (e: React.FormEvent) => void
  onGoogle:         () => void
}

export function RegisterStep1({
  email, setEmail,
  password, setPassword,
  confirmPassword, setConfirmPassword,
  showPw, togglePw,
  showConfirmPw, toggleConfirmPw,
  googleLoading, step1Loading, passwordStrengthInfo, onSubmit, onGoogle,
}: Props) {
  const { level, label, segColor, labelColor, criteriaList } = passwordStrengthInfo

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
          placeholder="marc@exemple.fr"
          className="w-full h-12 px-4 rounded-xl border-2 border-line focus:border-accent focus:outline-none text-sm font-semibold transition-colors" />
      </div>

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

        {level > 0 && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-1.5">
              <div className="flex gap-1 flex-1">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= level ? segColor : 'bg-line'}`} />
                ))}
              </div>
              <span className={`text-xs font-bold ml-1 w-16 text-right ${labelColor}`}>{label}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              {criteriaList.map(({ text, color, icon }) => (
                <div key={text} className="flex items-center gap-1">
                  <span className={`text-xs font-semibold transition-colors ${color}`}>
                    {icon} {text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">Confirmer le mot de passe</label>
        <div className="relative">
          <input type={showConfirmPw ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
            placeholder="Retapez votre mot de passe"
            className={`w-full h-12 px-4 pr-12 rounded-xl border-2 focus:outline-none text-sm font-semibold transition-colors ${
              confirmPassword && password !== confirmPassword
                ? 'border-red-300 focus:border-red-400'
                : confirmPassword && password === confirmPassword
                ? 'border-emerald-300 focus:border-emerald-400'
                : 'border-line focus:border-accent'
            }`} />
          <button type="button" onClick={toggleConfirmPw} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" aria-label="Afficher">
            <Icon name={showConfirmPw ? 'visibility_off' : 'visibility'} size={18} />
          </button>
        </div>
      </div>

      <button type="submit" disabled={step1Loading}
        className="w-full h-12 rounded-xl bg-primary font-bold text-secondary text-sm flex items-center justify-center gap-2 hover:bg-yellow-400 transition-colors btn-ripple disabled:opacity-60">
        {step1Loading
          ? <><Icon name="sync" size={18} className="animate-spin" />Vérification...</>
          : <>Continuer <Icon name="arrow_forward" size={18} /></>}
      </button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-line" />
        <span className="text-xs text-muted font-semibold">ou</span>
        <div className="flex-1 h-px bg-line" />
      </div>

      <button type="button" onClick={onGoogle} disabled={googleLoading}
        className="w-full h-12 rounded-xl border-2 border-line font-bold text-secondary text-sm flex items-center justify-center gap-3 hover:bg-bgsoft transition-colors disabled:opacity-60">
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

      <div className="pt-2 border-t border-line text-center">
        <p className="text-sm text-muted">Déjà un compte ?{' '}
          <Link href="/auth/login" className="font-bold text-secondary hover:text-primary transition-colors">Se connecter</Link>
        </p>
      </div>
    </form>
  )
}
