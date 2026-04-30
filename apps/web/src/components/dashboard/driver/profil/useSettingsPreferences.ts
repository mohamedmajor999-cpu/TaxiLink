'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useDriverStore } from '@/store/driverStore'
import { driverService } from '@/services/driverService'

interface State {
  vehicleModel: string
  vehiclePlate: string
  cpamEnabled: boolean
  loading: boolean
  saving: boolean
  saved: boolean
  error: string | null
  dirty: boolean
  setVehicleModel: (v: string) => void
  setVehiclePlate: (v: string) => void
  setCpamEnabled: (v: boolean) => void
  save: () => Promise<void>
}

export function useSettingsPreferences(): State {
  const { user } = useAuth()
  const { updateDriver } = useDriverStore()

  const [vehicleModel, setVehicleModel] = useState('')
  const [vehiclePlate, setVehiclePlate] = useState('')
  const [cpamEnabled, setCpamEnabled]   = useState(false)
  const [initial, setInitial] = useState({ vehicleModel: '', vehiclePlate: '', cpamEnabled: false })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    driverService.getDriver(user.id)
      .then((d) => {
        if (cancelled || !d) return
        const vm = d.vehicle_model ?? ''
        const vp = d.vehicle_plate ?? ''
        const cp = d.cpam_enabled ?? false
        setVehicleModel(vm)
        setVehiclePlate(vp)
        setCpamEnabled(cp)
        setInitial({ vehicleModel: vm, vehiclePlate: vp, cpamEnabled: cp })
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Erreur de chargement')
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [user])

  const dirty =
    vehicleModel !== initial.vehicleModel ||
    vehiclePlate !== initial.vehiclePlate ||
    cpamEnabled !== initial.cpamEnabled

  const save = async () => {
    if (!user) return
    setError(null)
    setSaving(true)
    try {
      await driverService.updateDriver(user.id, {
        vehicle_model: vehicleModel.trim() || null,
        vehicle_plate: vehiclePlate.trim() || null,
        cpam_enabled: cpamEnabled,
      })
      updateDriver({ vehicle: vehicleModel.trim() || undefined, cpamEnabled })
      setInitial({ vehicleModel: vehicleModel.trim(), vehiclePlate: vehiclePlate.trim(), cpamEnabled })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur lors de l\u2019enregistrement')
    } finally {
      setSaving(false)
    }
  }

  return {
    vehicleModel,
    vehiclePlate,
    cpamEnabled,
    loading,
    saving,
    saved,
    error,
    dirty,
    setVehicleModel,
    setVehiclePlate,
    setCpamEnabled,
    save,
  }
}
