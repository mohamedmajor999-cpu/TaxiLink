import { useState } from 'react'
import { missionService } from '@/services/missionService'
import { ApiRequestError } from '@/lib/api'

export function useReservationForm(
  onBookSuccess: () => Promise<void>,
  onSwitchToMissions: () => void,
) {
  const [departure,    setDeparture]    = useState('')
  const [destination,  setDestination]  = useState('')
  const [type,         setType]         = useState<'CPAM' | 'PRIVE'>('PRIVE')
  const [scheduledAt,  setScheduledAt]  = useState('')
  const [notes,        setNotes]        = useState('')
  const [submitting,   setSubmitting]   = useState(false)
  const [submitError,  setSubmitError]  = useState<string | null>(null)
  const [success,      setSuccess]      = useState(false)

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError(null)
    try {
      await missionService.create({ type, departure, destination, notes: notes || null })
      setSuccess(true)
      setDeparture(''); setDestination(''); setNotes(''); setScheduledAt('')
      await onBookSuccess()
      setTimeout(() => { setSuccess(false); onSwitchToMissions() }, 2000)
    } catch (err) {
      setSubmitError(err instanceof ApiRequestError ? err.message : 'Impossible de contacter le serveur')
    } finally {
      setSubmitting(false)
    }
  }

  return {
    departure,   setDeparture,
    destination, setDestination,
    type,        setType,
    scheduledAt, setScheduledAt,
    notes,       setNotes,
    submitting,  submitError, success,
    handleBook,
  }
}
