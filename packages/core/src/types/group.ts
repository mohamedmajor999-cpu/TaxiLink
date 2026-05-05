export type GroupRole = 'admin' | 'member'

export interface Group {
  id:           string
  name:         string
  description:  string | null
  createdBy:    string
  createdAt:    string
  memberCount?: number
  fleetOrgId?:  string | null  // si non-null : groupe-flotte auto-géré de cette org
}

export interface GroupMember {
  id:         string
  groupId:    string
  driverId:   string
  role:       GroupRole
  joinedAt:   string
  // joined from profiles
  fullName?:   string | null
  firstName?:  string | null
  lastName?:   string | null
  department?: string | null
}

export interface GroupMemberStats {
  driverId:      string
  fullName:      string | null
  firstName:     string | null
  lastName:      string | null
  department:    string | null
  phone:         string | null
  isOnline:      boolean
  role:          GroupRole
  sharedCount:   number
  acceptedCount: number
}
