'use client'

import { Icon } from '@/components/ui/Icon'
import { useReservationForm } from './useReservationForm'

interface Props {
  onBookSuccess: () => Promise<void>
  onSwitchToMissions: () => void
}

export function ReservationForm({ onBookSuccess, onSwitchToMissions }: Props) {
  const {
    departure, setDeparture, destination, setDestination,
    type, setType, scheduledAt, setScheduledAt,
    notes, setNotes, submitting, submitError, success, handleBook,
  } = useReservationForm(onBookSuccess, onSwitchToMissions)

  return (
    <div className="max-w-xl">
      <h2 className="text-2xl font-black text-secondary mb-1">Réserver un taxi</h2>
      <p className="text-muted mb-6">Un chauffeur professionnel disponible en quelques minutes</p>

      {success && (
        <div className="mb-6 p-4 rounded-2xl bg-green-50 border border-green-200 flex items-center gap-3">
          <Icon name="check_circle" size={20} className="text-green-500" />
          <div>
            <p className="font-bold text-green-800">Demande envoyée !</p>
            <p className="text-sm text-green-700">Un chauffeur va accepter votre course.</p>
          </div>
        </div>
      )}

      {submitError && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-red-600 text-sm">
          <Icon name="error" size={16} />{submitError}
        </div>
      )}

      <form onSubmit={handleBook} className="bg-white rounded-2xl shadow-soft p-6 space-y-4">
        <div>
          <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">Type de course</label>
          <div className="grid grid-cols-2 gap-2">
            {([
              { v: 'PRIVE' as const, icon: 'person',           l: 'Course privée'    },
              { v: 'CPAM'  as const, icon: 'medical_services', l: 'Transport CPAM'   },
            ]).map(({ v, icon, l }) => (
              <button key={v} type="button" onClick={() => setType(v)}
                className={`p-3 rounded-xl border-2 flex items-center gap-2 transition-all ${type === v ? 'border-primary bg-primary/10' : 'border-line'}`}>
                <Icon name={icon} size={16} className={type === v ? 'text-secondary' : 'text-muted'} />
                <span className={`text-sm font-semibold ${type === v ? 'text-secondary' : 'text-muted'}`}>{l}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="departure" className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">Adresse de départ</label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-secondary" />
            <input id="departure" type="text" value={departure} onChange={(e) => setDeparture(e.target.value)} required
              placeholder="15 rue de la Paix, Paris 8e"
              className="w-full h-12 pl-10 pr-4 rounded-xl border-2 border-line focus:border-accent focus:outline-none text-sm font-semibold" />
          </div>
        </div>

        <div>
          <label htmlFor="destination" className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">Adresse d'arrivée</label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-primary border-2 border-secondary" />
            <input id="destination" type="text" value={destination} onChange={(e) => setDestination(e.target.value)} required
              placeholder="Hôpital Lariboisière, Paris 10e"
              className="w-full h-12 pl-10 pr-4 rounded-xl border-2 border-line focus:border-accent focus:outline-none text-sm font-semibold" />
          </div>
        </div>

        <div>
          <label htmlFor="scheduledAt" className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">Date et heure souhaitées</label>
          <input id="scheduledAt" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full h-12 px-4 rounded-xl border-2 border-line focus:border-accent focus:outline-none text-sm font-semibold" />
        </div>

        <div>
          <label htmlFor="notes" className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">Notes (optionnel)</label>
          <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
            placeholder="Informations supplémentaires pour le chauffeur..."
            className="w-full px-4 py-3 rounded-xl border-2 border-line focus:border-accent focus:outline-none text-sm font-semibold resize-none" />
        </div>

        <button type="submit" disabled={submitting}
          className="w-full h-12 rounded-xl bg-primary font-bold text-secondary flex items-center justify-center gap-2 hover:bg-yellow-400 transition-colors btn-ripple disabled:opacity-60">
          {submitting
            ? <><Icon name="sync" size={18} className="animate-spin" />Envoi...</>
            : <><Icon name="local_taxi" size={18} />Demander un taxi</>}
        </button>
      </form>
    </div>
  )
}
