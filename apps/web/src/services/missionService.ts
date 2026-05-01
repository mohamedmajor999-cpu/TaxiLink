import { missionQueries } from './missionQueries'
import { missionMutations } from './missionMutations'
import { missionCorrectionService } from './missionCorrectionService'

export const missionService = {
  ...missionQueries,
  ...missionMutations,
  ...missionCorrectionService,
}
