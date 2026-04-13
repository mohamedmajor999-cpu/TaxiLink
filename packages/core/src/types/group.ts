export type GroupRole = 'admin' | 'member'

export interface Group {
  id:          string
  name:        string
  description: string | null
  createdBy:   string
  createdAt:   string
  memberCount?: number
}

export interface GroupMember {
  id:       string
  groupId:  string
  driverId: string
  role:     GroupRole
  joinedAt: string
  // joined from profiles
  fullName?: string | null
}
