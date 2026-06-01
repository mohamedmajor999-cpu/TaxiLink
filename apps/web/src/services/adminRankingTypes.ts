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
  userId:     string
  name:       string
  phone:      string | null
  // lat/lng null = chauffeur online sans fix GPS frais (premiere connexion,
  // GPS indoor, ou batterie OEM qui retarde le push position). Listing
  // cote admin l'affiche quand meme, juste sans marker sur la carte.
  lat:        number | null
  lng:        number | null
  updatedAt:  string | null
  lastSeenAt: string | null
}
