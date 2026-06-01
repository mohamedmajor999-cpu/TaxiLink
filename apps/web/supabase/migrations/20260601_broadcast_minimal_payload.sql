-- M-01 (audit) : le trigger broadcast_mission_event diffusait sur le canal PUBLIC
-- 'missions-realtime' un payload riche (departure/destination, coords, prix,
-- medical_motif = DONNEE DE SANTE Art.9 RGPD, transport_type, target_user_ids,
-- organization_id...). Meme sans nom/tel patient, c'est une fuite metier + sante
-- sur un canal ecoute par tout client authentifie, y compris pour des courses
-- ciblees/groupe qu'il ne devrait pas voir.
--
-- Fix : payload PUBLIC MINIMAL { id, status }. Tous les clients (web + mobile v2 + v3)
-- traitent deja le payload comme minimal et RE-HYDRATENT la mission via le RPC
-- authentifie get_mission_detail (masque cote serveur). Plus aucune donnee metier
-- en clair sur le canal public. status reste pour le filtre AVAILABLE cote client.
--
-- A APPLIQUER APRES le deploiement web 253f1b9 (le web re-fetch desormais ; appliquer
-- avant aurait affiche des cartes incompletes ~3 min le temps du build).

CREATE OR REPLACE FUNCTION public.broadcast_mission_event()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_payload jsonb;
  v_event   text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_event := 'DELETE';
    v_payload := jsonb_build_object('id', OLD.id);
  ELSE
    v_event := TG_OP;
    -- Payload PUBLIC MINIMAL : rien d'autre que id + status ne quitte la base en clair.
    v_payload := jsonb_build_object('id', NEW.id, 'status', NEW.status);
  END IF;

  PERFORM realtime.send(v_payload, v_event, 'missions-realtime', false);

  RETURN COALESCE(NEW, OLD);
END;
$function$;
