-- DOC-02 (audit experience VTC 2026-05-30) : l'UI mobile propose un slot
-- "Convention CPAM" (useDocumentsScreen.ts) mais la contrainte CHECK de
-- driver_documents n'autorise pas le type 'convention_cpam' -> tout envoi de la
-- convention CPAM est rejete par la base. On elargit la liste autorisee.
-- Changement purement additif (aucune ligne existante invalidee). Sans build.

ALTER TABLE public.driver_documents DROP CONSTRAINT driver_documents_type_check;

ALTER TABLE public.driver_documents
  ADD CONSTRAINT driver_documents_type_check
  CHECK (type = ANY (ARRAY['carte_pro','assurance','ct','permis','carte_grise','convention_cpam']));
