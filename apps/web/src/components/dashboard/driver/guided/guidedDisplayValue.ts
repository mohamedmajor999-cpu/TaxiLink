import type { Group } from '@taxilink/core'
import type { MissionFormState } from '../useMissionFormState'

/**
 * Formatte la valeur d'un champ du formulaire de mission pour affichage
 * dans le récap (ex : boolean → « Oui/Non », date ISO → « 21 avr »).
 */
export function formatFieldValue(id: string, form: MissionFormState, myGroups: Group[]): string | null {
  switch (id) {
    case 'type':          return form.type === 'CPAM' ? 'CPAM' : 'Privé'
    case 'medicalMotif':
      if (form.medicalMotif === 'HDJ') return 'Hôpital de jour'
      if (form.medicalMotif === 'CONSULTATION') return 'Consultation'
      return null
    case 'transportType':
      if (form.transportType === 'SEATED') return 'Assis'
      if (form.transportType === 'WHEELCHAIR') return 'Fauteuil roulant'
      if (form.transportType === 'STRETCHER') return 'Brancard'
      return null
    case 'patientName':   return form.patientName || null
    case 'phone':         return form.phone || null
    case 'date':          return form.date ? formatDate(form.date) : null
    case 'time':          return form.time || null
    case 'returnTrip':    return form.returnTrip ? 'Oui' : 'Non'
    case 'returnTime':    return form.returnTime || null
    case 'passengers':    return form.passengers != null ? `${form.passengers} passager${form.passengers > 1 ? 's' : ''}` : null
    case 'companion':     return form.companion ? 'Oui' : 'Non'
    case 'visibility':    return form.visibility === 'PUBLIC' ? 'Publique' : 'Mes groupes'
    case 'groupIds': {
      if (form.groupIds.length === 0) return null
      const names = form.groupIds
        .map((id) => myGroups.find((g) => g.id === id)?.name)
        .filter((n): n is string => !!n)
      if (names.length === 0) return `${form.groupIds.length} groupe${form.groupIds.length > 1 ? 's' : ''}`
      return names.join(', ')
    }
    case 'departure':     return form.departure || null
    case 'destination':   return form.destination || null
    default:              return null
  }
}

function formatDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return iso
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}
