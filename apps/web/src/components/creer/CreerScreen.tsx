'use client'

import { useCreerForm } from './useCreerForm'
import { useNavStore } from '@/store/navStore'
import { Icon } from '@/components/ui/Icon'
import { RouteInputs } from './RouteInputs'
import { MissionTypeSelector } from './MissionTypeSelector'
import { VehicleSelector } from './VehicleSelector'

export function CreerScreen() {
  const { setScreen } = useNavStore()
  const { form, dispatch, submitting, error, handleCalculate, handleSubmit } = useCreerForm()

  return (
    <div className="px-5 pt-5 pb-28 hide-scrollbar">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setScreen('flux')}
          aria-label="Retour"
          className="w-10 h-10 rounded-xl flex items-center justify-center text-secondary hover:bg-bgsoft transition-colors"
        >
          <Icon name="arrow_back" size={22} />
        </button>
        <h1 className="text-xl font-bold text-secondary">Publier une course</h1>
        <div className="w-10" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <RouteInputs
          departure={form.departure}
          destination={form.destination}
          distance={form.distance}
          duration={form.duration}
          price={form.price}
          onChange={(field, value) => dispatch({ type: 'SET_FIELD', field, value })}
          onCalculate={handleCalculate}
        />

        <div className="mt-8">
          <MissionTypeSelector
            value={form.missionType}
            onChange={(value) => dispatch({ type: 'SET_MISSION_TYPE', value })}
          />
        </div>

        <VehicleSelector
          value={form.vehicleType}
          onChange={(value) => dispatch({ type: 'SET_VEHICLE_TYPE', value })}
        />

        {form.missionType === 'cpam' && (
          <div className="space-y-3">
            <label className="block text-[10px] font-bold text-muted uppercase tracking-wider px-1">
              Informations patient
            </label>
            <input
              type="text"
              value={form.patientName}
              onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'patientName', value: e.target.value })}
              placeholder="Nom du patient"
              className="w-full h-14 px-4 rounded-xl bg-white border-2 border-line focus:border-accent focus:outline-none text-sm font-semibold transition-all"
            />
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'phone', value: e.target.value })}
              placeholder="Téléphone patient"
              className="w-full h-14 px-4 rounded-xl bg-white border-2 border-line focus:border-accent focus:outline-none text-sm font-semibold transition-all"
            />
          </div>
        )}

        <div>
          <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-2 px-1">
            Notes (optionnel)
          </label>
          <textarea
            value={form.notes}
            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'notes', value: e.target.value })}
            placeholder="Instructions particulières, accès difficile..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-white border-2 border-line focus:border-accent focus:outline-none text-sm font-semibold transition-all resize-none"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
            <Icon name="error" size={16} className="text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full h-14 rounded-2xl bg-primary font-bold text-secondary text-sm flex items-center justify-center gap-2 btn-ripple mt-4 disabled:opacity-60"
        >
          {submitting
            ? <><Icon name="sync" size={20} className="animate-spin" />Publication...</>
            : <><Icon name="publish" size={20} />Publier la course</>}
        </button>
      </form>
    </div>
  )
}
