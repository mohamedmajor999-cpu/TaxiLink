-- Correctif : la policy "org_members_select" creait une recursion infinie
-- (la subquery `org_id IN (SELECT current_org_ids())` declenche la meme
-- policy via current_org_ids() qui SELECT depuis organization_members).
-- Supabase rejetait la query avec un 500.
--
-- Nouvelle approche : un user voit uniquement SES PROPRES lignes (pas
-- celles des autres membres). C'est suffisant pour le dashboard patron V1.
-- Pour voir les autres membres d'une org (feature future settings), on
-- ajoutera une fonction RPC dediee `get_org_members(org_id)` SECURITY
-- DEFINER qui bypass RLS.

BEGIN;

DROP POLICY IF EXISTS "org_members_select" ON organization_members;

CREATE POLICY "org_members_select_self" ON organization_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Garantir que la fonction current_org_ids est executable par tous les roles
GRANT EXECUTE ON FUNCTION current_org_ids() TO authenticated, anon, service_role;

COMMIT;
