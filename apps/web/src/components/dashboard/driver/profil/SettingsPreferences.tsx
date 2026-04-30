'use client'
import { Loader2, Check, Bell, Shield } from 'lucide-react'
import { SettingItem } from '@/components/taxilink/SettingItem'
import { Switch } from '@/components/taxilink/Switch'
import { useSettingsToggles } from './useSettingsToggles'
import { useSettingsPreferences } from './useSettingsPreferences'

export function SettingsPreferences() {
  const t = useSettingsToggles()
  const s = useSettingsPreferences()

  return (
    <section className="mb-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-warm-500 px-1 mb-2">
        Préférences
      </p>

      <div className="bg-paper border border-warm-200 rounded-2xl p-4 flex flex-col gap-3 mb-2">
        <Field
          id="vehicle_model"
          label="Modèle du véhicule"
          value={s.vehicleModel}
          onChange={s.setVehicleModel}
          disabled={s.loading || s.saving}
          placeholder="Peugeot 508"
        />
        <Field
          id="vehicle_plate"
          label="Plaque d'immatriculation"
          value={s.vehiclePlate}
          onChange={s.setVehiclePlate}
          disabled={s.loading || s.saving}
          placeholder="AB-123-CD"
        />

        <label className="flex items-center justify-between px-1">
          <span className="flex items-center gap-2 text-[13px] text-ink">
            <Shield className="w-4 h-4 text-warm-600" strokeWidth={1.8} />
            Conventionné CPAM
          </span>
          <Switch
            label="CPAM"
            checked={s.cpamEnabled}
            onChange={s.setCpamEnabled}
          />
        </label>

        {s.error && (
          <div className="bg-danger-soft text-danger text-[12px] px-3 py-2 rounded-xl">
            {s.error}
          </div>
        )}

        <button
          type="button"
          onClick={s.save}
          disabled={!s.dirty || s.saving || s.loading}
          className="h-10 rounded-xl bg-ink text-paper text-[13px] font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-ink/90 transition-colors"
        >
          {s.saving && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />}
          {s.saved && !s.saving && <Check className="w-4 h-4" strokeWidth={2.5} />}
          {s.saved ? 'Enregistré' : 'Enregistrer'}
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <SettingItem
          icon={<Bell className="w-full h-full" strokeWidth={1.8} />}
          label="Notifications"
          description="Courses médicales · Groupe Taxi13"
          right={
            <Switch
              label="Notifications"
              checked={t.notifications}
              onChange={t.setNotifications}
            />
          }
        />
      </div>
    </section>
  )
}

function Field({
  id, label, value, onChange, disabled, placeholder,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  placeholder?: string
}) {
  return (
    <div>
      <label htmlFor={id} className="text-[11px] font-medium text-warm-500 px-1">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="mt-1 w-full h-10 px-3 rounded-xl bg-paper border border-warm-200 text-[13px] text-ink placeholder:text-warm-400 focus:outline-none focus:border-ink disabled:bg-warm-50 disabled:text-warm-500"
      />
    </div>
  )
}
