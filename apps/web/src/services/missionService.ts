import { missionQueries } from './missionQueries'
import { missionMutations } from './missionMutations'
import { missionProgressMutations } from './missionProgressMutations'
import { missionCorrectionService } from './missionCorrectionService'
import { missionManualService } from './missionManualService'

export const missionService = {
  ...missionQueries,
  ...missionMutations,
  ...missionProgressMutations,
  ...missionCorrectionService,
  createManual: missionManualService.create,
  updateManual: missionManualService.update,
  removeManual: missionManualService.remove,
}
