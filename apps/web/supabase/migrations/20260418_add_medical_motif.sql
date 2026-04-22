-- Ajoute le sous-motif médical pour les missions de type CPAM
-- HDJ         = Hôpital de jour (dialyse, chimio, radio, HDJ, rééducation)
-- CONSULTATION = Consultation / examen / transfert (entrée/sortie hospitalisation)

ALTER TABLE missions
  ADD COLUMN IF NOT EXISTS medical_motif TEXT;

ALTER TABLE missions
  DROP CONSTRAINT IF EXISTS missions_medical_motif_check;

ALTER TABLE missions
  ADD CONSTRAINT missions_medical_motif_check
  CHECK (medical_motif IS NULL OR medical_motif IN ('HDJ', 'CONSULTATION'));
