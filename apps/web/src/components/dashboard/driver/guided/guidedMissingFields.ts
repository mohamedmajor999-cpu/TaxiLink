import type { MissionFormState } from '../useMissionFormState'
import { GUIDED_QUESTIONS } from './guidedQuestions'

function isFilled(id: string, form: MissionFormState): boolean {
  switch (id) {
    case 'type':          return !!form.type
    case 'medicalMotif':  return !!form.medicalMotif
    case 'transportType': return !!form.transportType
    case 'patientName':   return form.patientName.trim().length > 0
    case 'phone':         return form.phone.trim().length > 0
    case 'date':          return !!form.date
    case 'time':          return !!form.time
    case 'returnTrip':    return true
    case 'returnTime':    return !!form.returnTime
    case 'passengers':    return form.passengers != null
    case 'companion':     return true
    case 'visibility':    return !!form.visibility
    case 'groupIds':      return form.groupIds.length > 0
    case 'departure':     return form.departure.trim().length >= 5
    case 'destination':   return form.destination.trim().length >= 5
    default:              return true
  }
}

export function getMissingQuestionIds(form: MissionFormState): string[] {
  const state = { type: form.type, returnTrip: form.returnTrip, visibility: form.visibility }
  return GUIDED_QUESTIONS
    .filter((q) => q.isVisible(state))
    .filter((q) => !q.optional)
    .filter((q) => !isFilled(q.id, form))
    .map((q) => q.id)
}
