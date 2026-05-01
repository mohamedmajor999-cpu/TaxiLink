import { missionQueries } from './missionQueries'
import { missionMutations } from './missionMutations'
import { missionProgressMutations } from './missionProgressMutations'
import { missionCorrectionService } from './missionCorrectionService'

export const missionService = {
  ...missionQueries,
  ...missionMutations,
  ...missionProgressMutations,
  ...missionCorrectionService,
}
