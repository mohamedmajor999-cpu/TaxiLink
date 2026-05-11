import { useEffect, useRef, useState } from 'react'
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

  // Timer post-success ref-ed pour pouvoir clear au unmount, sinon
  // onSwitchToMissions() pouvait tirer 2s plus tard sur un composant demonte
  // (warning setState + double switch si l'user avait deja change d'onglet).
  const switchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    return () => { if (switchTimerRef.current) clearTimeout(switchTimerRef.current) }
  }, [])

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError(null)
    try {
      // Convertit le datetime-local (YYYY-MM-DDTHH:MM, fuseau local) en ISO
      // UTC pour le serveur. Vide => le serveur applique now() par defaut
      // (course immediate).
      const scheduledDate = scheduledAt ? new Date(scheduledAt) : null
      // Borne basse : pas de reservation dans le passe (le datetime-local
      // accepte hier sans broncher si l'user le tape). 1 min de tolerance
      // pour absorber les decalages d'horloge.
      if (scheduledDate && scheduledDate.getTime() < Date.now() - 60_000) {
        setSubmitError('La date doit etre dans le futur')
        setSubmitting(false)
        return
      }
      const scheduled_at = scheduledDate ? scheduledDate.toISOString() : null
      await missionService.create({ type, departure, destination, notes: notes || null, scheduled_at })
      setSuccess(true)
      setDeparture(''); setDestination(''); setNotes(''); setScheduledAt('')
      await onBookSuccess()
      switchTimerRef.current = setTimeout(() => { setSuccess(false); onSwitchToMissions() }, 2000)
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
