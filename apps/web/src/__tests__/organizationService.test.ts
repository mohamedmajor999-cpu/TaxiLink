import { describe, it, expect, vi, beforeEach } from 'vitest'
import { organizationService } from '@/services/organizationService'

const { mockFrom, mockRpc, mockGetUser } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockRpc: vi.fn(),
  mockGetUser: vi.fn(),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: mockFrom,
    rpc: mockRpc,
    auth: { getUser: mockGetUser },
  }),
}))

vi.mock('@/services/organizationHelpers', () => ({
  buildInvitationLink: (token: string) => `https://taxilink.fr/invite/${token}`,
  generateToken: () => 'test-token-abc123',
  normalizePhone: (raw: string) => raw.replace(/\s+/g, '').replace(/^0/, '+33'),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

function chain(finalResult: { data: unknown; error: unknown }) {
  const terminal: Record<string, ReturnType<typeof vi.fn>> = {}
  const handler: ProxyHandler<typeof terminal> = {
    get(target, prop: string) {
      if (prop === 'then') {
        return (resolve: (v: unknown) => unknown) => Promise.resolve(finalResult).then(resolve)
      }
      if (!target[prop]) {
        target[prop] = vi.fn().mockReturnValue(new Proxy(terminal, handler))
      }
      return target[prop]
    },
  }
  return new Proxy(terminal, handler)
}

describe('organizationService.getMembershipsForUser', () => {
  it('retourne tableau vide si user n appartient a aucune org', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null })
    const result = await organizationService.getMembershipsForUser('user-1')
    expect(mockRpc).toHaveBeenCalledWith('current_org_ids')
    expect(result).toEqual([])
  })

  it('combine orgs + roles depuis les 2 requetes', async () => {
    mockRpc.mockResolvedValue({ data: ['org-1'], error: null })
    let callCount = 0
    mockFrom.mockImplementation((table: string) => {
      callCount++
      if (table === 'organizations') return chain({ data: [{ id: 'org-1', name: 'Org Un' }], error: null })
      if (table === 'organization_members') return chain({ data: [{ org_id: 'org-1', role: 'owner' }], error: null })
      throw new Error(`Unexpected table: ${table}`)
    })
    const result = await organizationService.getMembershipsForUser('user-1')
    expect(callCount).toBe(2)
    expect(result).toEqual([{ org_id: 'org-1', role: 'owner', organization: { id: 'org-1', name: 'Org Un' } }])
  })

  it('fallback role viewer si membre introuvable', async () => {
    mockRpc.mockResolvedValue({ data: ['org-1'], error: null })
    mockFrom.mockImplementation((table: string) => {
      if (table === 'organizations') return chain({ data: [{ id: 'org-1', name: 'Org Un' }], error: null })
      return chain({ data: [], error: null })
    })
    const result = await organizationService.getMembershipsForUser('user-1')
    expect(result[0].role).toBe('viewer')
  })

  it('jette si la RPC current_org_ids echoue', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'rpc fail' } })
    await expect(organizationService.getMembershipsForUser('user-1')).rejects.toThrow('rpc fail')
  })
})

describe('organizationService.getOrgById', () => {
  it('retourne l org si trouvee', async () => {
    mockFrom.mockReturnValue(chain({ data: { id: 'org-1', name: 'X' }, error: null }))
    const result = await organizationService.getOrgById('org-1')
    expect(result).toEqual({ id: 'org-1', name: 'X' })
  })

  it('jette si erreur Supabase', async () => {
    mockFrom.mockReturnValue(chain({ data: null, error: { message: 'denied' } }))
    await expect(organizationService.getOrgById('org-1')).rejects.toThrow('denied')
  })
})

describe('organizationService.inviteMember', () => {
  it('refuse si non authentifie', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    await expect(organizationService.inviteMember('org-1', 'a@b.fr', 'email')).rejects.toThrow('Non authentifie')
  })

  it('normalise le contact email (lowercase + trim)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    const insertSpy = vi.fn().mockReturnValue(chain({ data: { id: 'inv-1', token: 'test-token-abc123' }, error: null }))
    mockFrom.mockReturnValue({ insert: insertSpy })
    const result = await organizationService.inviteMember('org-1', '  TEST@example.COM  ', 'email')
    expect(insertSpy).toHaveBeenCalledWith(expect.objectContaining({ contact: 'test@example.com', contact_type: 'email' }))
    expect(result.link).toBe('https://taxilink.fr/invite/test-token-abc123')
  })

  it('normalise le contact phone (espaces supprimes, prefixe +33)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    const insertSpy = vi.fn().mockReturnValue(chain({ data: { id: 'inv-2' }, error: null }))
    mockFrom.mockReturnValue({ insert: insertSpy })
    await organizationService.inviteMember('org-1', '06 12 34 56 78', 'phone', 'dispatcher')
    expect(insertSpy).toHaveBeenCalledWith(expect.objectContaining({ contact: '+33612345678', role: 'dispatcher' }))
  })
})

describe('organizationService.removeMember / acceptInvitation / updateOrg / listOrgInvitations', () => {
  it('removeMember appelle la RPC et jette si non success', async () => {
    mockRpc.mockResolvedValue({ data: { success: false, error: 'NOT_OWNER' }, error: null })
    await expect(organizationService.removeMember('org-1', 'user-2')).rejects.toThrow('NOT_OWNER')
    expect(mockRpc).toHaveBeenCalledWith('remove_org_member', { target_org_id: 'org-1', target_user_id: 'user-2' })
  })

  it('removeMember resout si success', async () => {
    mockRpc.mockResolvedValue({ data: { success: true }, error: null })
    await expect(organizationService.removeMember('org-1', 'user-2')).resolves.toBeUndefined()
  })

  it('acceptInvitation retourne success+orgId', async () => {
    mockRpc.mockResolvedValue({ data: { success: true, org_id: 'org-1' }, error: null })
    const result = await organizationService.acceptInvitation('tok')
    expect(result).toEqual({ success: true, orgId: 'org-1', error: undefined })
  })

  it('acceptInvitation retourne success false si la RPC remonte une erreur PG', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'expired' } })
    const result = await organizationService.acceptInvitation('tok')
    expect(result).toEqual({ success: false, error: 'expired' })
  })

  it('updateOrg jette si erreur', async () => {
    mockFrom.mockReturnValue(chain({ data: null, error: { message: 'denied' } }))
    await expect(organizationService.updateOrg('org-1', { name: 'Nouveau' })).rejects.toThrow('denied')
  })

  it('listOrgInvitations retourne tableau vide si data null', async () => {
    mockFrom.mockReturnValue(chain({ data: null, error: null }))
    const result = await organizationService.listOrgInvitations('org-1')
    expect(result).toEqual([])
  })
})
