-- Systeme d'invitation pour les organisations.
--
-- Workflow :
--   1. Patron (owner/admin) cree une invitation via UI
--      -> INSERT dans org_invitations avec un token random unique
--   2. Patron partage le lien magique : https://taxilink.fr/invite/<token>
--      via Email / SMS / WhatsApp (boutons cote client)
--   3. Destinataire clique :
--      a. Si pas connecte -> redirect login (avec ?next=/invite/<token>)
--      b. Si connecte -> page /invite/<token> qui appelle accept_invitation()
--   4. accept_invitation() (SECURITY DEFINER) :
--      - verifie token valide + non expire + non accepte
--      - INSERT dans organization_members (org_id, auth.uid(), role)
--      - UPDATE invitation SET status='accepted', accepted_by, accepted_at
--      - returns success
--
-- Pour le MVP : token = 32 chars random, expire en 7 jours, pas de relance auto.

BEGIN;

CREATE TABLE IF NOT EXISTS org_invitations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invited_by    UUID NOT NULL REFERENCES auth.users(id),
  contact       TEXT NOT NULL,
  contact_type  TEXT NOT NULL CHECK (contact_type IN ('email', 'phone')),
  role          TEXT NOT NULL DEFAULT 'viewer'
                CHECK (role IN ('owner', 'admin', 'dispatcher', 'accountant', 'viewer')),
  token         TEXT NOT NULL UNIQUE,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'accepted', 'cancelled', 'expired')),
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  accepted_by   UUID REFERENCES auth.users(id),
  accepted_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_org_invitations_token   ON org_invitations(token);
CREATE INDEX IF NOT EXISTS idx_org_invitations_org     ON org_invitations(org_id);
CREATE INDEX IF NOT EXISTS idx_org_invitations_contact ON org_invitations(contact);

ALTER TABLE org_invitations ENABLE ROW LEVEL SECURITY;

-- Voir les invitations de ses orgs
DROP POLICY IF EXISTS "org_invitations_select" ON org_invitations;
CREATE POLICY "org_invitations_select" ON org_invitations
  FOR SELECT TO authenticated
  USING (org_id IN (SELECT current_org_ids()));

-- Creer des invitations seulement si owner/admin de l'org
DROP POLICY IF EXISTS "org_invitations_insert" ON org_invitations;
CREATE POLICY "org_invitations_insert" ON org_invitations
  FOR INSERT TO authenticated
  WITH CHECK (
    invited_by = auth.uid()
    AND org_id IN (
      SELECT om.org_id FROM organization_members om
      WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'admin')
    )
  );

-- Annuler ses invitations
DROP POLICY IF EXISTS "org_invitations_update" ON org_invitations;
CREATE POLICY "org_invitations_update" ON org_invitations
  FOR UPDATE TO authenticated
  USING (
    invited_by = auth.uid()
    OR org_id IN (
      SELECT om.org_id FROM organization_members om
      WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'admin')
    )
  );

-- Fonction RPC : accepter une invitation (SECURITY DEFINER pour bypass RLS)
CREATE OR REPLACE FUNCTION accept_invitation(invitation_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_invitation org_invitations%ROWTYPE;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_AUTHENTICATED');
  END IF;

  SELECT * INTO v_invitation
  FROM org_invitations
  WHERE token = invitation_token
  LIMIT 1;

  IF v_invitation.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVITATION_NOT_FOUND');
  END IF;

  IF v_invitation.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVITATION_' || v_invitation.status);
  END IF;

  IF v_invitation.expires_at < now() THEN
    UPDATE org_invitations SET status = 'expired' WHERE id = v_invitation.id;
    RETURN jsonb_build_object('success', false, 'error', 'INVITATION_EXPIRED');
  END IF;

  -- Verifier que l'user n'est pas deja membre
  IF EXISTS (
    SELECT 1 FROM organization_members
    WHERE org_id = v_invitation.org_id AND user_id = v_user_id
  ) THEN
    UPDATE org_invitations
    SET status = 'accepted', accepted_by = v_user_id, accepted_at = now()
    WHERE id = v_invitation.id;
    RETURN jsonb_build_object('success', true, 'org_id', v_invitation.org_id, 'already_member', true);
  END IF;

  -- Si l'user est deja chauffeur ailleurs, on le transfere : retire des autres orgs
  -- pour qu'il soit dans une seule org "officielle". Sinon, ajout simple.
  -- (V1 : on permet d'etre dans plusieurs orgs, on ne retire rien)

  INSERT INTO organization_members (org_id, user_id, role)
  VALUES (v_invitation.org_id, v_user_id, v_invitation.role);

  -- Si c'est un driver et qu'il etait dans "Independants", on le sort de la
  -- pour le mettre dans cette org (visibilite UI)
  UPDATE drivers
  SET organization_id = v_invitation.org_id
  WHERE id = v_user_id
    AND organization_id = (SELECT id FROM organizations WHERE name = 'Independants');

  UPDATE org_invitations
  SET status = 'accepted', accepted_by = v_user_id, accepted_at = now()
  WHERE id = v_invitation.id;

  RETURN jsonb_build_object('success', true, 'org_id', v_invitation.org_id);
END $$;

GRANT EXECUTE ON FUNCTION accept_invitation(TEXT) TO authenticated, anon;

-- Fonction RPC : retirer un membre (SECURITY DEFINER, owner/admin uniquement)
-- Pour un driver, le retire de l'org et le remet dans "Independants".
CREATE OR REPLACE FUNCTION remove_org_member(target_org_id UUID, target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller UUID;
  v_caller_role TEXT;
  v_indep_org_id UUID;
BEGIN
  v_caller := auth.uid();
  IF v_caller IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_AUTHENTICATED');
  END IF;

  SELECT role INTO v_caller_role
  FROM organization_members
  WHERE org_id = target_org_id AND user_id = v_caller;

  IF v_caller_role NOT IN ('owner', 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'FORBIDDEN');
  END IF;

  -- Empecher de virer le dernier owner
  IF v_caller_role = 'owner' AND v_caller = target_user_id THEN
    IF (SELECT COUNT(*) FROM organization_members WHERE org_id = target_org_id AND role = 'owner') = 1 THEN
      RETURN jsonb_build_object('success', false, 'error', 'CANNOT_REMOVE_LAST_OWNER');
    END IF;
  END IF;

  DELETE FROM organization_members WHERE org_id = target_org_id AND user_id = target_user_id;

  -- Si c'est un driver, le re-rattacher a "Independants"
  SELECT id INTO v_indep_org_id FROM organizations WHERE name = 'Independants' LIMIT 1;
  IF v_indep_org_id IS NOT NULL THEN
    UPDATE drivers SET organization_id = v_indep_org_id
    WHERE id = target_user_id AND organization_id = target_org_id;
  END IF;

  RETURN jsonb_build_object('success', true);
END $$;

GRANT EXECUTE ON FUNCTION remove_org_member(UUID, UUID) TO authenticated;

COMMIT;
