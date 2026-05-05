import { createClient } from '@/lib/supabase/client'
import type { Organization, OrgInvitation, OrgRole } from '@/lib/supabase/types'
import { buildInvitationLink, generateToken, normalizePhone } from './organizationHelpers'

export { buildInvitationLink }

export interface Membership {
  org_id: string
  role: OrgRole
  organization: Organization
}

export type ContactType = 'email' | 'phone'

export interface InvitationResult {
  invitation: OrgInvitation
  link: string
  isAlreadyMember: boolean
}

export const organizationService = {
  async getMembershipsForUser(userId: string): Promise<Membership[]> {
    const supabase = createClient()

    // 1. Org IDs via RPC (SECURITY DEFINER, bypass RLS sur organization_members)
    const { data: orgIds, error: rpcErr } = await supabase.rpc('current_org_ids')
    if (rpcErr) throw new Error(rpcErr.message)
    if (!orgIds || orgIds.length === 0) return []

    // 2. Organizations (RLS OK : id IN current_org_ids)
    const { data: orgs, error: orgErr } = await supabase
      .from('organizations')
      .select('*')
      .in('id', orgIds)
    if (orgErr) throw new Error(orgErr.message)

    // 3. Roles : query organization_members en se restreignant a l'user pour
    //    contourner la RLS recursive (la policy filtre par org_id IN ... ce
    //    qui peut bugger sur la propre row de l'user dans certains contextes).
    const { data: members, error: memErr } = await supabase
      .from('organization_members')
      .select('org_id, role')
      .eq('user_id', userId)
      .in('org_id', orgIds)
    if (memErr) throw new Error(memErr.message)

    return (orgs ?? []).map((org) => {
      const m = members?.find((mb) => mb.org_id === org.id)
      return {
        org_id: org.id,
        role: ((m?.role as OrgRole | undefined) ?? 'viewer') as OrgRole,
        organization: org,
      }
    })
  },

  async getOrgById(orgId: string): Promise<Organization | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data
  },

  async inviteMember(
    orgId: string,
    contact: string,
    contactType: ContactType,
    role: OrgRole = 'viewer'
  ): Promise<InvitationResult> {
    const supabase = createClient()
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) throw new Error('Non authentifie')

    const normalized = contactType === 'phone' ? normalizePhone(contact) : contact.toLowerCase().trim()
    const token = generateToken()

    const { data: invitation, error } = await supabase
      .from('org_invitations')
      .insert({
        org_id: orgId,
        invited_by: user.user.id,
        contact: normalized,
        contact_type: contactType,
        role,
        token,
      })
      .select()
      .single()
    if (error) throw new Error(error.message)

    return {
      invitation,
      link: buildInvitationLink(token),
      isAlreadyMember: false,
    }
  },

  async removeMember(orgId: string, userId: string): Promise<void> {
    const supabase = createClient()
    const { data, error } = await supabase.rpc('remove_org_member', {
      target_org_id: orgId,
      target_user_id: userId,
    })
    if (error) throw new Error(error.message)
    const result = data as { success: boolean; error?: string }
    if (!result.success) throw new Error(result.error ?? 'Erreur inconnue')
  },

  async acceptInvitation(token: string): Promise<{ success: boolean; orgId?: string; error?: string }> {
    const supabase = createClient()
    const { data, error } = await supabase.rpc('accept_invitation', { invitation_token: token })
    if (error) return { success: false, error: error.message }
    const result = data as { success: boolean; org_id?: string; error?: string }
    return { success: result.success, orgId: result.org_id, error: result.error }
  },

  async updateOrg(orgId: string, updates: { name?: string; siret?: string | null; auto_dispatch_enabled?: boolean }): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from('organizations').update(updates).eq('id', orgId)
    if (error) throw new Error(error.message)
  },

  async listOrgInvitations(orgId: string): Promise<OrgInvitation[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('org_invitations')
      .select('*')
      .eq('org_id', orgId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data ?? []
  },
}
