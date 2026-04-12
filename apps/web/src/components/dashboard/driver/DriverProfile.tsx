'use client'

import { useDriverProfile } from './useDriverProfile'
import { Icon } from '@/components/ui/Icon'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import Link from 'next/link'

export function DriverProfile({ driverName }: { driverName: string }) {
  const { profile, setProfile, driver, setDriver, saving, saved, error, handleSave } = useDriverProfile(driverName)

  return (
    <div className="max-w-2xl space-y-6 pb-20 md:pb-0">
      <div>
        <h2 className="text-2xl font-black text-secondary mb-1">Mon profil</h2>
        <p className="text-muted text-sm">Gérez vos informations personnelles et professionnelles</p>
      </div>

      {error && <ErrorBanner message={error} />}

      {/* Driver card */}
      <div className="bg-secondary rounded-2xl p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white font-black text-2xl flex-shrink-0">
          {profile.full_name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="text-white font-black text-xl">{profile.full_name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Icon key={i} name="star" size={14} className={i < Math.round(driver.rating) ? 'text-primary' : 'text-white/20'} />
              ))}
              <span className="text-white/60 text-xs ml-1">{driver.rating}</span>
            </div>
            <span className="text-white/30">·</span>
            <span className="text-white/60 text-xs">{driver.total_rides} courses</span>
          </div>
          <div className="mt-2 inline-flex items-center gap-1.5 bg-primary/20 rounded-lg px-2.5 py-1">
            <Icon name="verified" size={12} className="text-primary" />
            <span className="text-primary text-[10px] font-black uppercase">Pro</span>
          </div>
        </div>
      </div>

      {/* Personal info */}
      <div className="bg-white rounded-2xl shadow-soft p-6 space-y-4">
        <h3 className="font-bold text-secondary text-lg">Informations personnelles</h3>
        {[
          { label: 'Nom complet', key: 'full_name', type: 'text',  placeholder: 'Marc Fontaine' },
          { label: 'Email',       key: 'email',     type: 'email', placeholder: 'marc@exemple.fr', disabled: true },
          { label: 'Téléphone',   key: 'phone',     type: 'tel',   placeholder: '+33 6 12 34 56 78' },
        ].map((f) => (
          <div key={f.key}>
            <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">{f.label}</label>
            <input type={f.type} value={(profile as any)[f.key]} disabled={f.disabled}
              onChange={(e) => setProfile((p) => ({ ...p, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              className="w-full h-12 px-4 rounded-xl border-2 border-line focus:border-accent focus:outline-none text-sm font-semibold transition-colors disabled:bg-bgsoft disabled:text-muted" />
          </div>
        ))}
      </div>

      {/* Vehicle */}
      <div className="bg-white rounded-2xl shadow-soft p-6 space-y-4">
        <h3 className="font-bold text-secondary text-lg">Véhicule</h3>
        {[
          { label: 'Modèle', key: 'vehicle_model', placeholder: 'Mercedes Classe E' },
          { label: 'Plaque', key: 'vehicle_plate', placeholder: 'AB-123-CD' },
        ].map((f) => (
          <div key={f.key}>
            <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">{f.label}</label>
            <input type="text" value={(driver as any)[f.key]}
              onChange={(e) => setDriver((d) => ({ ...d, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              className="w-full h-12 px-4 rounded-xl border-2 border-line focus:border-accent focus:outline-none text-sm font-semibold transition-colors" />
          </div>
        ))}
        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="font-semibold text-secondary">Agréé CPAM</p>
            <p className="text-xs text-muted">Activez si vous transportez des patients CPAM</p>
          </div>
          <button onClick={() => setDriver((d) => ({ ...d, cpam_enabled: !d.cpam_enabled }))}
            aria-label="Toggle CPAM"
            className={`relative w-12 h-6 rounded-full transition-colors ${driver.cpam_enabled ? 'bg-green-500' : 'bg-line'}`}>
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${driver.cpam_enabled ? 'left-6' : 'left-0.5'}`} />
          </button>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving}
        className="w-full h-12 rounded-xl bg-primary font-bold text-secondary flex items-center justify-center gap-2 hover:bg-yellow-400 transition-colors btn-ripple disabled:opacity-60">
        {saving ? <><Icon name="sync" size={18} className="animate-spin" />Enregistrement...</>
          : saved ? <><Icon name="check_circle" size={18} />Enregistré !</>
          : <><Icon name="save" size={18} />Enregistrer les modifications</>}
      </button>

      <div className="bg-white rounded-2xl shadow-soft p-6">
        <h3 className="font-bold text-secondary mb-3">Application mobile</h3>
        <p className="text-sm text-muted mb-4">Accédez à TaxiLink Pro directement depuis votre téléphone.</p>
        <Link href="/telecharger" target="_blank"
          className="h-10 px-5 rounded-xl bg-secondary text-white text-sm font-semibold flex items-center gap-2 w-fit hover:bg-secondary/80 transition-colors">
          <Icon name="qr_code" size={16} />Installer l'application
        </Link>
      </div>
    </div>
  )
}
