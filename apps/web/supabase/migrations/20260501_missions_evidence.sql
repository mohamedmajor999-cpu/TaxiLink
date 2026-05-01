-- Preuves de transport CPAM : signature patient + photo bon de transport.
--
-- Pourquoi : pour facturer la securite sociale, le chauffeur doit prouver
-- (1) que le patient a bien ete pris en charge (signature au pickup) et
-- (2) qu'un bon de transport medical valide a ete presente (photo).
-- Stockes dans un bucket Storage *prive* — RGPD Article 9 (donnees de sante).
--
-- Champs columns sur missions :
--   pickup_signature_url   : chemin dans le bucket (pas une URL publique)
--   transport_voucher_url  : chemin dans le bucket
--
-- Bucket : mission-evidence, prive.
-- Hierarchie des chemins : <mission_id>/signature.png et
--                          <mission_id>/voucher.<ext>
-- Cette structure permet a la RLS de filtrer par mission_id (prefix folder).

ALTER TABLE missions
  ADD COLUMN IF NOT EXISTS pickup_signature_url   text,
  ADD COLUMN IF NOT EXISTS transport_voucher_url  text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('mission-evidence', 'mission-evidence', false)
ON CONFLICT (id) DO NOTHING;

-- RLS sur storage.objects pour le bucket mission-evidence.
-- Un fichier appartient a la mission dont l'id est le 1er segment du path
-- (ex: "abc-123/signature.png"). Seul le driver assigne a cette mission
-- peut lire ou ecrire ces fichiers. Le service_role bypass tout (utilise
-- pour les exports BI / facturation automatique).

DROP POLICY IF EXISTS "Driver can read own mission evidence" ON storage.objects;
CREATE POLICY "Driver can read own mission evidence" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'mission-evidence'
    AND EXISTS (
      SELECT 1 FROM public.missions m
      WHERE m.id::text = (storage.foldername(name))[1]
        AND m.driver_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Driver can upload own mission evidence" ON storage.objects;
CREATE POLICY "Driver can upload own mission evidence" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'mission-evidence'
    AND EXISTS (
      SELECT 1 FROM public.missions m
      WHERE m.id::text = (storage.foldername(name))[1]
        AND m.driver_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Driver can replace own mission evidence" ON storage.objects;
CREATE POLICY "Driver can replace own mission evidence" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'mission-evidence'
    AND EXISTS (
      SELECT 1 FROM public.missions m
      WHERE m.id::text = (storage.foldername(name))[1]
        AND m.driver_id = auth.uid()
    )
  );
