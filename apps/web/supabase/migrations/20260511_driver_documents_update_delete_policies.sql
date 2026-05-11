-- Ajoute les policies UPDATE et DELETE manquantes sur driver_documents.
--
-- Avant : RLS enabled avec uniquement SELECT + INSERT scoped a auth.uid().
-- upsertDocument fait un UPDATE quand existingId existe (re-upload d'un doc)
-- -> sans policy UPDATE, Supabase rejette mais retourne 0 rows affected sans
-- erreur -> le chauffeur croit avoir maj son doc, le file_url en DB pointe
-- encore vers l'ancien path orphelin.
--
-- Egalement : DELETE manquant rend impossible la suppression d'une row par
-- l'user (utile pour le RGPD / anonymisation compte).
--
-- Appliquee en prod 2026-05-11 via MCP.

DROP POLICY IF EXISTS "Modification documents propres" ON public.driver_documents;
CREATE POLICY "Modification documents propres"
  ON public.driver_documents FOR UPDATE
  USING (driver_id = auth.uid())
  WITH CHECK (driver_id = auth.uid());

DROP POLICY IF EXISTS "Suppression documents propres" ON public.driver_documents;
CREATE POLICY "Suppression documents propres"
  ON public.driver_documents FOR DELETE
  USING (driver_id = auth.uid());
