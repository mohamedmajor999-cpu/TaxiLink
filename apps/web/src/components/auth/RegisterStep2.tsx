'use client'

import { Icon } from '@/components/ui/Icon'

interface Props {
  firstName:     string
  setFirstName:  (v: string) => void
  lastName:      string
  setLastName:   (v: string) => void
  phone:         string
  setPhone:      (v: string) => void
  department:    string
  setDepartment: (v: string) => void
  loading:       boolean
  onSubmit:      (e: React.FormEvent) => void
  onBack:        () => void
}

export function RegisterStep2({
  firstName, setFirstName,
  lastName, setLastName,
  phone, setPhone,
  department, setDepartment,
  loading, onSubmit, onBack,
}: Props) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
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
      </div>

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
            placeholder="13" maxLength={3}
            className="w-full h-12 px-4 rounded-xl border-2 border-line focus:border-accent focus:outline-none text-sm font-semibold transition-colors" />
        </div>
      </div>

      <button type="submit" disabled={loading}
        className="w-full h-12 rounded-xl bg-primary font-bold text-secondary text-sm flex items-center justify-center gap-2 hover:bg-yellow-400 transition-colors btn-ripple disabled:opacity-60">
        {loading
          ? <><Icon name="sync" size={18} className="animate-spin" />Création...</>
          : <><Icon name="person_add" size={18} />Créer mon compte gratuit</>}
      </button>

      <button type="button" onClick={onBack}
        className="w-full h-10 rounded-xl text-sm font-semibold text-muted hover:text-secondary transition-colors flex items-center justify-center gap-1.5">
        <Icon name="arrow_back" size={16} />Retour
      </button>
    </form>
  )
}
