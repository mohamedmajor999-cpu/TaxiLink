-- =============================================================================
-- TaxiLink — Migrations PROPOSÉES suite à l'audit du 2026-05-29
-- Projet Supabase : taxilink-pro (ivumykufinlniffxqlud)
-- =============================================================================
--
-- ⛔ NE PAS APPLIQUER TEL QUEL EN PRODUCTION.
--
-- Ce fichier n'est PAS exécuté. C'est un brouillon relisable des correctifs
-- serveur des blockers de l'audit. Chaque bloc cite l'état RÉEL vérifié en live
-- le 2026-05-29 (pg_policies / pg_constraint / pg_get_functiondef).
--
-- Procédure recommandée AVANT prod :
--   1. Créer une branche Supabase de test (mcp create_branch) ou un projet staging.
--   2. Appliquer bloc par bloc, dans l'ordre (H-01 → … ).
--   3. Tester les chemins de lecture/écriture impactés (feed missions, détail,
--      acceptation, création, realtime) avec un compte chauffeur réel.
--   4. Vérifier les données existantes AVANT chaque CHECK (requêtes fournies).
--   5. Merger la branche / appliquer en prod seulement après validation.
--
-- Les correctifs marqués (APP) exigent AUSSI une modification du code mobile/web
-- pour rester cohérents — détaillée en commentaire.
--
-- -----------------------------------------------------------------------------
-- VALIDATION 2026-05-29 : le branching Supabase exige le plan Pro (projet en Free),
-- donc CHAQUE bloc ci-dessous a été exécuté contre le schéma + les données RÉELS de
-- prod dans une transaction `BEGIN … ROLLBACK` (rollback vérifié, ZÉRO persistance).
-- Résultat : les 6 blocs s'appliquent SANS erreur (colonnes, types, fonctions OK).
-- Donnée utile : 0 mission en prod n'a price_eur hors [0..500] → le CHECK H-03 peut
-- être posé directement en VALID (sans l'étape NOT VALID), voir note dans le bloc.
-- -----------------------------------------------------------------------------
-- ÉTAT D'APPLICATION EN PROD (2026-05-29) :
--   ✅ APPLIQUÉ : H-03 (CHECK price_eur, en VALID) · M-04 (INSERT durci) ·
--      I-02 (garde role profiles) · L-06 (RPC group_remove_member/delete_group) ·
--      H-01 *moitié additive* (RPC get_mission_detail créé).
--      App couplée : missionQueries.getByIdMasked + 5 sites v3 basculés.
--   ⏳ EN ATTENTE (cassant, à appliquer APRÈS déploiement app + gestion v2) :
--      H-01 *moitié cassante* (resserrage policy SELECT "Lecture missions...") ;
--      M-01 (broadcast réduit) — le re-fetch realtime côté app V3 est FAIT
--        (MissionRealtimeProvider re-hydrate via getByIdMasked). AVANT d'appliquer
--        la réduction du payload en prod : faire la MÊME bascule dans v2 (prod) qui
--        lit encore le payload riche, sinon son feed/alertes cassent ; puis déployer.
--      H-02 (policy UPDATE chauffeur + trigger guard) — à tester sur flux progression.
--   📋 DASHBOARD : L-09 (leaked-password) + L-01 (longueur min mot de passe).
-- -----------------------------------------------------------------------------
-- =============================================================================


-- =============================================================================
-- H-01 — FUITE DE PII PATIENT (RGPD Art. 9)        [PRIORITÉ : IMMÉDIATE]
-- =============================================================================
-- État actuel (vérifié) :
--   Policy SELECT "Lecture missions disponibles" sur public.missions :
--     USING ((status = 'AVAILABLE') OR (driver_id = auth.uid()) OR (client_id = auth.uid()))
--   → la branche status='AVAILABLE' donne la LECTURE LIGNE COMPLÈTE (patient_name,
--     phone, notes…) de TOUTE mission dispo à n'importe quel authentifié.
--   missionQueries.getById fait select('*') → la PII traverse le réseau, le
--   masquage n'est qu'à l'affichage. En prod : 90 missions AVAILABLE, 59 avec nom.
--
-- Correctif : la lecture LIGNE COMPLÈTE est réservée au propriétaire / chauffeur
-- assigné / auteur. La navigation du marketplace passe déjà par le RPC masqué
-- get_marketplace_missions (SECURITY DEFINER). Pour le DÉTAIL d'une mission non
-- encore acceptée, on ajoute un RPC masqué dédié.

-- (APP) Après cette migration, remplacer missionQueries.getById(select('*')) par
--       un appel à get_mission_detail(p_mission_id) ci-dessous. Sinon l'écran
--       détail/active d'une mission NON possédée renverra 0 ligne.

BEGIN;

-- 1a. Resserrer la policy SELECT : plus de lecture pleine ligne sur AVAILABLE.
DROP POLICY IF EXISTS "Lecture missions disponibles" ON public.missions;
CREATE POLICY "Lecture missions possedees" ON public.missions
  FOR SELECT
  USING (
    driver_id = auth.uid()
    OR client_id = auth.uid()
    OR shared_by = auth.uid()
  );

-- 1b. RPC masqué pour le détail d'une mission (reproduit canSeeFullMission côté serveur).
--     Renvoie la PII uniquement si l'appelant est propriétaire / chauffeur / auteur,
--     sinon la masque. Visibilité : la mission doit être AVAILABLE (browsable) ou possédée.
CREATE OR REPLACE FUNCTION public.get_mission_detail(p_mission_id uuid)
RETURNS public.missions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  m public.missions;
  v_owner boolean;
BEGIN
  SELECT * INTO m FROM public.missions WHERE id = p_mission_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'mission introuvable' USING ERRCODE = 'no_data_found';
  END IF;

  v_owner := (m.driver_id = auth.uid()) OR (m.client_id = auth.uid()) OR (m.shared_by = auth.uid());

  -- Non-propriétaire : seules les missions AVAILABLE sont consultables, et masquées.
  IF NOT v_owner THEN
    IF m.status <> 'AVAILABLE' THEN
      RAISE EXCEPTION 'acces refuse' USING ERRCODE = 'insufficient_privilege';
    END IF;
    m.patient_name          := NULL;
    m.phone                 := NULL;
    m.notes                 := NULL;
    m.pickup_signature_url  := NULL;
    m.transport_voucher_url := NULL;
  END IF;

  RETURN m;
END;
$$;

REVOKE ALL ON FUNCTION public.get_mission_detail(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_mission_detail(uuid) TO authenticated;

COMMIT;

-- ⚠️ À TESTER : feed home + onglet Disponibles (RPC get_marketplace_missions, doit
--   toujours marcher car SECURITY DEFINER), détail mission acceptée vs non-acceptée,
--   écran active, patch realtime. Vérifier qu'aucun chemin web (dashboard) ne
--   faisait un select('*') direct sur des missions non possédées.


-- =============================================================================
-- H-02 / H-03 / L-04 — INTÉGRITÉ DU PRIX + UPDATE CHAUFFEUR TROP LARGE
--                                                  [PRIORITÉ : IMMÉDIATE]
-- =============================================================================
-- État actuel (vérifié) :
--   - missions_price_range_check ne borne que price_min/max_eur (≤500). Le scalaire
--     price_eur n'a AUCUNE contrainte (nullable, numeric).
--   - Policy UPDATE "Gestion mission chauffeur" :
--       USING (driver_id = auth.uid())
--       WITH CHECK ((driver_id = auth.uid()) OR (driver_id IS NULL))
--     → aucun prédicat de statut, aucune colonne scopée. Un chauffeur peut, via
--       PostgREST + JWT, modifier price_eur/horodatages/adresses/PII de SA mission,
--       ou poser driver_id = NULL (se détacher d'une course en cours).
--
-- Correctif : (a) borne price_eur, (b) retire la branche driver_id IS NULL,
--   (c) trigger qui interdit au chauffeur (non-auteur) de muter les colonnes
--       sensibles — l'UPDATE chauffeur ne sert qu'à la progression de course.

-- AVANT le CHECK : vérifier qu'aucune ligne existante ne le violerait.
--   SELECT count(*) FROM public.missions WHERE price_eur < 0 OR price_eur > 500;
-- Si > 0, corriger/plafonner ces lignes d'abord, sinon le VALIDATE échoue.

BEGIN;

-- (a) Borne price_eur. NOT VALID = n'exige pas la validation immédiate des
--     lignes existantes ; VALIDATE séparément après nettoyage des données.
ALTER TABLE public.missions
  ADD CONSTRAINT missions_price_eur_check
  CHECK (price_eur IS NULL OR (price_eur >= 0 AND price_eur <= 500)) NOT VALID;
-- Après nettoyage des données :
--   ALTER TABLE public.missions VALIDATE CONSTRAINT missions_price_eur_check;

-- (b) Retirer la possibilité de se détacher (driver_id IS NULL) côté chauffeur.
DROP POLICY IF EXISTS "Gestion mission chauffeur" ON public.missions;
CREATE POLICY "Gestion mission chauffeur" ON public.missions
  FOR UPDATE
  TO authenticated
  USING (driver_id = auth.uid())
  WITH CHECK (driver_id = auth.uid());   -- plus de "OR driver_id IS NULL"

-- (c) Trigger : un UPDATE émis par le CHAUFFEUR assigné (et qui n'est pas aussi
--     l'auteur) ne peut toucher que les colonnes de progression / complétion.
--     Toute tentative de modifier prix / adresses / PII / parties tierces est rejetée.
CREATE OR REPLACE FUNCTION public.guard_driver_mission_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  -- Ne s'applique qu'au chauffeur assigné agissant en tant que tel.
  IF auth.uid() IS NULL OR NEW.driver_id IS DISTINCT FROM auth.uid() THEN
    RETURN NEW;
  END IF;
  -- L'auteur (client/shared_by) garde ses droits d'édition via sa propre policy.
  IF OLD.client_id = auth.uid() OR OLD.shared_by = auth.uid() THEN
    RETURN NEW;
  END IF;

  -- Colonnes IMMUABLES pour un chauffeur : il ne fait que faire avancer la course.
  IF NEW.price_eur     IS DISTINCT FROM OLD.price_eur
   OR NEW.price_min_eur IS DISTINCT FROM OLD.price_min_eur
   OR NEW.price_max_eur IS DISTINCT FROM OLD.price_max_eur
   OR NEW.client_id     IS DISTINCT FROM OLD.client_id
   OR NEW.shared_by     IS DISTINCT FROM OLD.shared_by
   OR NEW.departure     IS DISTINCT FROM OLD.departure
   OR NEW.destination   IS DISTINCT FROM OLD.destination
   OR NEW.patient_name  IS DISTINCT FROM OLD.patient_name
   OR NEW.phone         IS DISTINCT FROM OLD.phone
   OR NEW.target_user_ids IS DISTINCT FROM OLD.target_user_ids
   OR NEW.organization_id IS DISTINCT FROM OLD.organization_id
  THEN
    RAISE EXCEPTION 'champ non modifiable par le chauffeur' USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_driver_mission_update ON public.missions;
CREATE TRIGGER trg_guard_driver_mission_update
  BEFORE UPDATE ON public.missions
  FOR EACH ROW EXECUTE FUNCTION public.guard_driver_mission_update();

COMMIT;

-- ⚠️ À TESTER : acceptation de course, transitions enroute/pickup/dropoff/completed,
--   no_show, et que l'AUTEUR peut toujours éditer prix/adresses tant que AVAILABLE.


-- =============================================================================
-- M-04 / L-05 — DURCISSEMENT DE L'INSERT MISSIONS            [COURT TERME]
-- =============================================================================
-- État actuel (vérifié) :
--   Policy INSERT "Création mission client" :
--     WITH CHECK ((auth.uid() = client_id) OR (client_id IS NULL))
--   → client_id est bien forcé (le spoofing d'attribution est déjà bloqué), MAIS
--     shared_by, status, scheduled_at, target_user_ids, driver_id sont libres :
--     insert possible en IN_PROGRESS/DONE, antidaté, mauvaise org via shared_by, etc.
--
-- Correctif : forcer shared_by ∈ {auth.uid(), NULL}, status='AVAILABLE' à l'insert,
--   driver_id NULL à l'insert (L-05).

BEGIN;

DROP POLICY IF EXISTS "Création mission client" ON public.missions;
CREATE POLICY "Création mission client" ON public.missions
  FOR INSERT
  WITH CHECK (
    (auth.uid() = client_id OR client_id IS NULL)
    AND (shared_by = auth.uid() OR shared_by IS NULL)
    AND status = 'AVAILABLE'
    AND driver_id IS NULL
  );

COMMIT;

-- Note : un contrôle anti-antidatage (scheduled_at >= now() - interval '1 hour')
-- est possible mais sensible au décalage d'horloge client ; à évaluer séparément.


-- =============================================================================
-- M-01 — FUITE D'ANNONCES CIBLÉES VIA REALTIME (canal public)   [IMMÉDIATE]
-- =============================================================================
-- État actuel (vérifié) : broadcast_mission_event() (SECURITY DEFINER, trigger)
--   diffuse le payload COMPLET (trajet, coords exactes, prix, medical_motif ET
--   target_user_ids) via realtime.send(..., 'missions', false) → canal PUBLIC,
--   realtime.messages sans policy. Seule la PII patient (nom/tél/notes) est exclue.
--   La restriction "Personnes choisies" n'est qu'un filtre d'affichage client.
--
-- Correctif proposé (minimal, sûr) : ne diffuser sur le canal global qu'un payload
--   RÉDUIT (identifiants + statut + département + horaire), JAMAIS les champs métier
--   sensibles ni target_user_ids. Les clients re-fetchent les détails via le RPC
--   masqué get_marketplace_missions / get_mission_detail (qui appliquent la visibilité).
--
-- (APP) MissionRealtimeProvider / useNewMissionAlert lisent aujourd'hui des champs
--       (prix, trajet…) directement dans le payload broadcast → les faire re-fetch
--       via RPC sur réception d'un événement. Tester avant prod.

CREATE OR REPLACE FUNCTION public.broadcast_mission_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_payload jsonb;
  v_event   text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_event := 'DELETE';
    v_payload := jsonb_build_object('id', OLD.id);
  ELSE
    v_event := TG_OP;
    -- Payload RÉDUIT : juste de quoi déclencher un re-fetch ciblé côté client.
    -- PAS de prix, coords exactes, target_user_ids, medical_motif sur le canal public.
    v_payload := jsonb_build_object(
      'id',          NEW.id,
      'status',      NEW.status,
      'type',        NEW.type,
      'visibility',  NEW.visibility,
      'departement', NEW.departement,
      'scheduled_at', NEW.scheduled_at
    );
  END IF;

  PERFORM realtime.send(v_payload, v_event, 'missions', false);
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Alternative plus robuste (non scriptée ici) : topics Realtime PRIVÉS par
-- département / par groupe / par user, avec RLS sur realtime.messages, pour que
-- seuls les destinataires légitimes reçoivent même l'événement réduit.


-- =============================================================================
-- I-02 — PROFILES : EMPÊCHER L'AUTO-MODIFICATION DE role / is_verified  [COURT TERME]
-- =============================================================================
-- État actuel (vérifié) : policy UPDATE "Modification profil propre" :
--     USING (auth.uid() = id)  — PAS de WITH CHECK
--   + authenticated a le privilège UPDATE sur public.profiles.
--   → un user peut se mettre role='admin'/is_verified=true. AUJOURD'HUI sans impact
--     (l'autorisation serveur se base sur app_metadata via trigger, et l'admin est
--     email-gated) — mais durcissement latent recommandé avant toute surface admin.
--
-- Correctif : trigger qui réinitialise role / is_verified à leur ancienne valeur
--   pour tout UPDATE NON service_role.

CREATE OR REPLACE FUNCTION public.guard_profile_privileged_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role' THEN
    NEW.role := OLD.role;
    -- Dé-commenter si la colonne existe :
    -- NEW.is_verified := OLD.is_verified;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_profile_privileged_fields ON public.profiles;
CREATE TRIGGER trg_guard_profile_privileged_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_privileged_fields();
-- ⚠️ Vérifier le nom exact de la colonne (is_verified ?) avant d'activer la ligne.


-- =============================================================================
-- L-06 — AUTORITÉ ADMIN DE GROUPE (kick / delete) ABSENTE       [COURT TERME]
-- =============================================================================
-- État actuel (vérifié) :
--   group_members : gm_delete USING (driver_id = auth.uid())  → on ne peut retirer
--     QUE sa propre adhésion. groups : groups_select + groups_insert UNIQUEMENT
--     (aucune policy DELETE/UPDATE) → deleteGroup renvoie 0 ligne pour tout le monde.
--   → côté positif : pas d'escalade ; côté négatif : la fonctionnalité admin
--     "retirer un membre" / "supprimer le groupe" est un no-op silencieux.
--
-- Correctif : RPC SECURITY DEFINER vérifiant que l'appelant est le créateur du
--   groupe (adapter si un modèle d'admin multiple existe via group_members.role).

CREATE OR REPLACE FUNCTION public.group_remove_member(p_group_id uuid, p_driver_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.groups WHERE id = p_group_id AND created_by = auth.uid()) THEN
    RAISE EXCEPTION 'non autorise : seul le createur du groupe peut retirer un membre'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF p_driver_id = auth.uid() THEN
    RAISE EXCEPTION 'le createur ne peut pas se retirer ainsi' USING ERRCODE = 'check_violation';
  END IF;
  DELETE FROM public.group_members WHERE group_id = p_group_id AND driver_id = p_driver_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_group(p_group_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.groups WHERE id = p_group_id AND created_by = auth.uid()) THEN
    RAISE EXCEPTION 'non autorise : seul le createur peut supprimer le groupe'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  DELETE FROM public.group_members WHERE group_id = p_group_id;   -- nettoyage adhésions
  DELETE FROM public.groups WHERE id = p_group_id;
END;
$$;

REVOKE ALL ON FUNCTION public.group_remove_member(uuid, uuid) FROM public;
REVOKE ALL ON FUNCTION public.delete_group(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.group_remove_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_group(uuid) TO authenticated;
-- (APP) groupService.removeMember / deleteGroup doivent appeler ces RPC au lieu
--       des DELETE directs (aujourd'hui silencieusement no-op).


-- =============================================================================
-- L-09 — PROTECTION MOTS DE PASSE FUITÉS (HIBP)        [IMMÉDIATE — PAS DE SQL]
-- =============================================================================
-- À activer dans le Dashboard Supabase → Authentication → Policies / Password :
--   - "Leaked password protection" : ON (vérification HaveIBeenPwned).
--   - Remonter la longueur minimale du mot de passe (et durcir isValidPassword
--     dans @taxilink/core, partagé web+mobile).
-- Pas de migration SQL : configuration GoTrue.


-- =============================================================================
-- Rappel : exécuter aussi get_advisors(security) après application pour confirmer
-- la disparition des lints, et envisager de passer les RPC SECURITY DEFINER non
-- mutatifs en SECURITY INVOKER là où c'est possible (advisors 0028/0029).
-- =============================================================================
