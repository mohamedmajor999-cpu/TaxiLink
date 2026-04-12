import { useState } from 'react'
import { useDriverStore } from '@/store/driverStore'
import { useModalStore } from '@/store/modalStore'
import { profileService } from '@/services/profileService'
import { authService } from '@/services/authService'

export function useEditProfilModal() {
  const { driver, updateDriver } = useDriverStore()
  const { closeModal } = useModalStore()
  const [form, setForm] = useState({
    name: driver.name,
    phone: driver.phone ?? '',
    email: driver.email,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [emailConfirmSent, setEmailConfirmSent] = useState(false)

  const handleSave = async () => {
    if (!driver.id) return
    setIsSaving(true)
    try {
      const tasks: Promise<void>[] = [
        profileService.updateProfile(driver.id, {
          full_name: form.name,
          phone: form.phone,
        }),
      ]
      const emailChanged = form.email.trim() !== driver.email
      if (emailChanged) tasks.push(authService.updateEmail(form.email.trim()))
      await Promise.all(tasks)
      updateDriver(form)
      if (emailChanged) {
        setEmailConfirmSent(true)
      } else {
        closeModal()
      }
    } catch (err) {
      console.error('[EditProfilModal] save failed', err)
    } finally {
      setIsSaving(false)
    }
  }

  return { form, setForm, isSaving, emailConfirmSent, closeModal, handleSave }
}
