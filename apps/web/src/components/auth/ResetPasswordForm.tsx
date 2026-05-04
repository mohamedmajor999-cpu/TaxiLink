'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Icon } from '@/components/ui/Icon'
import { AuthBrandPanel } from './AuthBrandPanel'
import { useResetPasswordForm } from './useResetPasswordForm'

export function ResetPasswordForm() {
  const form = useResetPasswordForm()
  const { level, label, segColor, labelColor, criteriaList } = form.passwordStrengthInfo

  return (
    <div className="min-h-screen bg-bgsoft lg:grid lg:grid-cols-2">
      <AuthBrandPanel
        eyebrow="Nouveau mot de passe"
        title={<>Choisissez un<br />mot de passe<br />solide.</>}
        lead="Pas de réutilisation, pas d'évidences. On vous redirige vers la connexion juste après."
      />
      <div className="flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center mb-6 lg:hidden" aria-label="TaxiLink Pro">
            <Image src="/brand/logo-primary.svg" alt="TaxiLink Pro" width={224} height={40} priority className="h-10 w-auto" />
          </Link>
          <h1 className="text-2xl font-black text-secondary">Nouveau mot de passe</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-soft p-8">
          {form.status === 'verifying' && (
            <div className="text-center space-y-3 py-6">
              <Icon name="sync" size={32} className="text-muted animate-spin mx-auto" />
              <p className="text-sm text-muted">Vérification du lien…</p>
            </div>
          )}

          {form.status === 'invalid' && (
            <div className="text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                <Icon name="error" size={32} className="text-red-600" />
              </div>
              <div>
                <p className="font-bold text-secondary">Lien invalide ou expiré</p>
                <p className="text-sm text-muted mt-1">{form.error || 'Demandez un nouveau lien de réinitialisation.'}</p>
              </div>
              <Link href="/auth/forgot-password"
                className="block w-full h-12 rounded-xl bg-primary font-bold text-secondary text-sm flex items-center justify-center gap-2 hover:bg-yellow-400 transition-colors">
                <Icon name="send" size={16} />Demander un nouveau lien
              </Link>
            </div>
          )}

          {form.status === 'done' && (
            <div className="text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <Icon name="check_circle" size={32} className="text-green-600" />
              </div>
              <div>
                <p className="font-bold text-secondary">Mot de passe mis à jour</p>
                <p className="text-sm text-muted mt-1">On vous redirige vers la connexion…</p>
              </div>
            </div>
          )}

          {(form.status === 'ready' || form.status === 'updating') && (
            <form onSubmit={form.handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">Nouveau mot de passe</label>
                <div className="relative">
                  <input type={form.showPw ? 'text' : 'password'} value={form.password} onChange={e => form.setPassword(e.target.value)} required minLength={8}
                    placeholder="8 caractères minimum"
                    className="w-full h-12 px-4 pr-12 rounded-xl border-2 border-line focus:border-accent focus:outline-none text-sm font-semibold transition-colors" />
                  <button type="button" onClick={form.togglePw} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" aria-label="Afficher">
                    <Icon name={form.showPw ? 'visibility_off' : 'visibility'} size={18} />
                  </button>
                </div>

                {level > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <div className="flex gap-1 flex-1 justify-center">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= level ? segColor : 'bg-line'}`} />
                        ))}
                      </div>
                      <span className={`text-xs font-bold ml-1 w-16 text-right ${labelColor}`}>{label}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                      {criteriaList.map(({ text, color, icon }) => (
                        <div key={text} className="flex items-center gap-1">
                          <span className={`text-xs font-semibold transition-colors ${color}`}>{icon} {text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">Confirmer le mot de passe</label>
                <div className="relative">
                  <input type={form.showConfirmPw ? 'text' : 'password'} value={form.confirmPassword} onChange={e => form.setConfirmPassword(e.target.value)} required
                    placeholder="Retapez votre mot de passe"
                    className={`w-full h-12 px-4 pr-12 rounded-xl border-2 focus:outline-none text-sm font-semibold transition-colors ${form.confirmBorderClass}`} />
                  <button type="button" onClick={form.toggleConfirmPw} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" aria-label="Afficher">
                    <Icon name={form.showConfirmPw ? 'visibility_off' : 'visibility'} size={18} />
                  </button>
                </div>
              </div>

              {form.error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                  <Icon name="error" size={16} className="text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-600">{form.error}</p>
                </div>
              )}

              <button type="submit" disabled={form.status === 'updating'}
                className="w-full h-12 rounded-xl bg-primary font-bold text-secondary text-sm flex items-center justify-center gap-2 hover:bg-yellow-400 transition-colors btn-ripple disabled:opacity-60">
                {form.status === 'updating'
                  ? <><Icon name="sync" size={18} className="animate-spin" />Mise à jour…</>
                  : <><Icon name="lock_reset" size={18} />Mettre à jour le mot de passe</>}
              </button>
            </form>
          )}
        </div>
      </div>
      </div>
    </div>
  )
}
