// Types pour les classements (chauffeurs, groupes) et la carte temps réel.

export interface DriverRanking {
  userId:     string
  name:       string
  phone:      string | null
  isOnline:   boolean
  rating:     number
  posted:     number
  accepted:   number
  completed:  number
  caEur:      number
  apiCostUsd: number
}

export interface GroupRanking {
  groupId:        string
  name:           string
  description:    string | null
  members:        number
  missionsTotal:  number
  missions30d:    number
  acceptanceRate: number
  lastMissionAt:  string | null
}

export interface GroupCounters {
  totalGroups:     number
  activeGroups30d: number
  totalMembers:    number
}

export interface OnlineDriver {
  userId:    string
  name:      string
  phone:     string | null
  lat:       number
  lng:       number
  updatedAt: string
}
