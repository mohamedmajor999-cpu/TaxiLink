import { useState, useEffect } from 'react'
import { profileService } from '@/services/profileService'
import { driverService } from '@/services/driverService'
import { useAuth } from '@/hooks/useAuth'

export function useDriverProfile(driverName: string) {
  const { user } = useAuth()
  const [profile, setProfile] = useState({ full_name: driverName, phone: '', email: '' })
  const [driver,  setDriver]  = useState({ vehicle_model: '', vehicle_plate: '', cpam_enabled: false, rating: 5, total_rides: 0 })
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    setProfile((p) => ({ ...p, email: user.email ?? '' }))
    profileService.getProfile(user.id).then((data) => {
      if (data) setProfile((p) => ({ ...p, full_name: data.full_name ?? '', phone: data.phone ?? '' }))
    })
    driverService.getDriver(user.id).then((data) => {
      if (data) setDriver({
        vehicle_model: data.vehicle_model ?? '',
        vehicle_plate: data.vehicle_plate ?? '',
        cpam_enabled:  data.cpam_enabled,
        rating:        data.rating,
        total_rides:   data.total_rides,
      })
    })
  }, [user])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    setError(null)
    try {
      await Promise.all([
        profileService.updateProfile(user.id, { full_name: profile.full_name, phone: profile.phone }),
        driverService.updateDriver(user.id, {
          vehicle_model: driver.vehicle_model,
          vehicle_plate: driver.vehicle_plate,
          cpam_enabled:  driver.cpam_enabled,
        }),
      ])
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de sauvegarder le profil')
    } finally {
      setSaving(false)
    }
  }

  return { profile, setProfile, driver, setDriver, saving, saved, error, handleSave }
}
