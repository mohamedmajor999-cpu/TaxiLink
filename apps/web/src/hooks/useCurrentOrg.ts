'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { organizationService, type Membership } from '@/services/organizationService'
import type { OrgRole } from '@/lib/supabase/types'

const PATRON_ROLES: OrgRole[] = ['owner', 'admin', 'dispatcher', 'accountant', 'viewer']

export function useCurrentOrg() {
  const { user, loading: authLoading } = useAuth()
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setMemberships([])
      setLoading(false)
      return
    }
    organizationService
      .getMembershipsForUser(user.id)
      .then((m) => setMemberships(m))
      .catch(() => setMemberships([]))
      .finally(() => setLoading(false))
  }, [user, authLoading])

  // V1 : on pick la première org du user. Multi-org switcher viendra plus tard.
  const active = memberships[0] ?? null

  return {
    orgId: active?.org_id ?? null,
    role: active?.role ?? null,
    organization: active?.organization ?? null,
    memberships,
    isPatron: !!active && PATRON_ROLES.includes(active.role),
    isLoading: authLoading || loading,
  }
}
