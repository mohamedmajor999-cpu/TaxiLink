-- Suite du fix RLS recursive : la policy "org_members_manage" (FOR ALL,
-- inclut SELECT) contient elle aussi une subquery sur organization_members,
-- ce qui declenche la meme recursion 500 que la policy "org_members_select"
-- corrigee precedemment.
--
-- Pour le MVP : on droppe la policy. Les INSERT/UPDATE/DELETE sur
-- organization_members ne sont pas dans le scope de la V1 du dashboard
-- patron (pas d'invitation de membres via UI). Elles seront re-implementees
-- plus tard via API routes server-side avec service_role, ou via une
-- fonction PL/pgSQL SECURITY DEFINER dediee.

BEGIN;

DROP POLICY IF EXISTS "org_members_manage" ON organization_members;

COMMIT;
