-- Fix realtime annonces : aligner le TOPIC du broadcast serveur sur le canal client.
--
-- Regression (audit fonctionnel 2026-05-29, constat ANN-01) : la fonction
-- broadcast_mission_event() emet sur le topic 'missions' alors que TOUS les
-- clients (apps/web, mobile-driver-v2 en prod, mobile-driver-v3) souscrivent au
-- canal 'missions-realtime'. Resultat : plus aucun event realtime n'est livre
-- in-app (feed fige, pins fantomes de courses deja prises, popup "Nouvelle
-- annonce" jamais affichee).
--
-- Correctif minimal : changer le topic 'missions' -> 'missions-realtime' dans le
-- seul appel realtime.send(). AUCUN client a modifier (les 3 ecoutent deja
-- 'missions-realtime'). Le corps de la fonction est reproduit a l'identique de la
-- version DEPLOYEE en prod (incl. target_user_ids, que le fichier d'origine
-- 20260507_missions_realtime_broadcast_no_pii.sql avait perdu).
--
-- Note : la minimisation du payload sur canal public (audit securite M-01) est un
-- durcissement SEPARE et optionnel ; cette migration ne touche QUE le routage.

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
    v_payload := jsonb_build_object(
      'id',                   NEW.id,
      'status',               NEW.status,
      'type',                 NEW.type,
      'visibility',           NEW.visibility,
      'departement',          NEW.departement,
      'departure',            NEW.departure,
      'destination',          NEW.destination,
      'departure_lat',        NEW.departure_lat,
      'departure_lng',        NEW.departure_lng,
      'destination_lat',      NEW.destination_lat,
      'destination_lng',      NEW.destination_lng,
      'distance_km',          NEW.distance_km,
      'duration_min',         NEW.duration_min,
      'static_duration_min',  NEW.static_duration_min,
      'scheduled_at',         NEW.scheduled_at,
      'driver_id',            NEW.driver_id,
      'client_id',            NEW.client_id,
      'shared_by',            NEW.shared_by,
      'organization_id',      NEW.organization_id,
      'target_user_ids',      NEW.target_user_ids,
      'price_eur',            NEW.price_eur,
      'price_min_eur',        NEW.price_min_eur,
      'price_max_eur',        NEW.price_max_eur,
      'medical_motif',        NEW.medical_motif,
      'transport_type',       NEW.transport_type,
      'passengers',           NEW.passengers,
      'return_trip',          NEW.return_trip,
      'return_time',          NEW.return_time,
      'companion',            NEW.companion,
      'view_count',           NEW.view_count,
      'auto_completed',       NEW.auto_completed,
      'no_show',              NEW.no_show,
      'accepted_at',          NEW.accepted_at,
      'enroute_at',           NEW.enroute_at,
      'arrived_at_pickup_at', NEW.arrived_at_pickup_at,
      'pickup_at',            NEW.pickup_at,
      'arrived_at_dest_at',   NEW.arrived_at_dest_at,
      'dropoff_at',           NEW.dropoff_at,
      'completed_at',         NEW.completed_at,
      'created_at',           NEW.created_at,
      'updated_at',           NEW.updated_at
      -- VOLONTAIREMENT EXCLUS : patient_name, phone, notes,
      -- pickup_signature_url, transport_voucher_url
    );
  END IF;

  -- FIX ANN-01 : topic 'missions' -> 'missions-realtime' (canal ecoute par tous les clients)
  PERFORM realtime.send(v_payload, v_event, 'missions-realtime', false);

  RETURN COALESCE(NEW, OLD);
END;
$function$;

COMMENT ON FUNCTION public.broadcast_mission_event() IS
  'Broadcast mission events sur Supabase Realtime (topic ''missions-realtime'') sans PII patient. Topic corrige le 2026-05-30 (ANN-01) pour matcher les clients web/v2/v3.';
