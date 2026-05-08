-- Realtime sans PII : broadcast manuel via trigger au lieu de postgres_changes.
--
-- Probleme RGPD : Supabase Realtime postgres_changes envoie le payload brut de
-- la ligne (toutes colonnes, dont patient_name/phone/notes) via WebSocket. RLS
-- s'applique au niveau ligne mais pas colonne. Un chauffeur qui ouvre les
-- DevTools voit les noms patients en clair des missions AVAILABLE du
-- marketplace (RLS SELECT autorise tous les AVAILABLE).
--
-- Fix : trigger AFTER INSERT/UPDATE/DELETE qui broadcast un payload reduit
-- (zero PII) via realtime.send(). Le client souscrit en mode 'broadcast' au
-- topic 'missions' et recoit uniquement des champs non-PII. Pour la version
-- complete (apres acceptation), le client fait un SELECT classique qui passe
-- par RLS.
--
-- Champs INCLUS dans le broadcast :
--   - id, status, type, visibility
--   - departement, departure_lat/lng, destination_lat/lng
--   - distance_km, duration_min, scheduled_at
--   - driver_id, client_id, shared_by, organization_id
--   - price_eur, price_min_eur, price_max_eur
--   - timestamps progression (accepted_at, enroute_at, ...)
--   - flags (auto_completed, no_show, return_trip, companion)
--   - departure, destination (adresses : non-PII patient)
--   - medical_motif (categoriel HDJ/CONSULTATION, pas diagnostic)
--   - transport_type, passengers, return_time, view_count
--   - created_at, updated_at
--
-- Champs EXCLUS (PII strictes) :
--   - patient_name, phone, notes
--   - pickup_signature_url, transport_voucher_url

CREATE OR REPLACE FUNCTION public.broadcast_mission_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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

  PERFORM realtime.send(v_payload, v_event, 'missions', false);

  RETURN COALESCE(NEW, OLD);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.broadcast_mission_event() FROM PUBLIC;

DROP TRIGGER IF EXISTS broadcast_mission_event_trigger ON public.missions;
CREATE TRIGGER broadcast_mission_event_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.missions
  FOR EACH ROW EXECUTE FUNCTION public.broadcast_mission_event();

COMMENT ON FUNCTION public.broadcast_mission_event() IS
  'Broadcast mission events sur Supabase Realtime (topic ''missions'') sans PII patient. Remplace le pattern postgres_changes qui exposait toute la ligne brute.';
