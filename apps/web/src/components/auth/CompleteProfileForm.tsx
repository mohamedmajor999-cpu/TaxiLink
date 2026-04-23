'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Icon } from '@/components/ui/Icon'
import { useCompleteProfileForm } from './useCompleteProfileForm'

interface Props {
  userId:            string
  initialFirstName:  string
  initialLastName:   string
  initialPhone:      string
  redirectTo:        string
}

export function CompleteProfileForm(props: Props) {
  const {
    firstName, setFirstName,
    lastName,  setLastName,
    phone,     setPhone,
    loading, error, handleSubmit,
  } = useCompleteProfileForm(props)

  return (
    <div className="min-h-screen bg-bgsoft flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center mb-6" aria-label="TaxiLink Pro">
            <Image src="/brand/logo-primary.svg" alt="TaxiLink Pro" width={224} height={40} priority className="h-10 w-auto" />
          </Link>
          <h1 className="text-3xl font-black text-secondary mb-2">Dernière étape</h1>
          <p className="text-muted">Complétez votre profil pour continuer</p>
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
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">Nom</label>
              <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required
                placeholder="Fontaine"
                className="w-full h-12 px-4 rounded-xl border-2 border-line focus:border-accent focus:outline-none text-sm font-semibold transition-colors" />
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">Prénom</label>
              <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required
                placeholder="Marc"
                className="w-full h-12 px-4 rounded-xl border-2 border-line focus:border-accent focus:outline-none text-sm font-semibold transition-colors" />
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">Téléphone</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required
                placeholder="0601020304"
                className="w-full h-12 px-4 rounded-xl border-2 border-line focus:border-accent focus:outline-none text-sm font-semibold transition-colors" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full h-12 rounded-xl bg-primary font-bold text-secondary text-sm flex items-center justify-center gap-2 hover:bg-yellow-400 transition-colors btn-ripple disabled:opacity-60 disabled:cursor-not-allowed">
              {loading
                ? <><Icon name="sync" size={18} className="animate-spin" />Enregistrement...</>
                : <><Icon name="check" size={18} />Continuer</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
