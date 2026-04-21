import type { MissionFormState } from '../useMissionFormState'

/**
 * Valeur de départ (brouillon) du renderer pour une question donnée,
 * dérivée de l'état actuel du formulaire.
 */
export function initialValueForQuestion(id: string, form: MissionFormState): unknown {
  switch (id) {
    case 'type':          return form.type
    case 'medicalMotif':  return form.medicalMotif
    case 'transportType': return form.transportType
    case 'patientName':   return form.patientName
    case 'phone':         return form.phone
    case 'date':          return form.date
    case 'time':          return form.time
    case 'returnTrip':    return form.returnTrip
    case 'returnTime':    return form.returnTime ?? ''
    case 'passengers':    return form.passengers
    case 'companion':     return form.companion
    case 'visibility':    return form.visibility
    case 'groupIds':      return form.groupIds
    case 'departure':     return form.departure
    case 'destination':   return form.destination
    default:              return null
  }
}
