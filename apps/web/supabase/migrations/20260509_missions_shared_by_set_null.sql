-- Fix : missions.shared_by avait ON DELETE NO ACTION qui bloquait
-- l'auth.admin.deleteUser() pour tout chauffeur ayant publie des missions
-- (cascade auth.users -> profiles -> drivers bloque par la FK).
--
-- Volume actuel (2026-05-09) : 133 missions ont shared_by NOT NULL.
--
-- Apres cette migration, la suppression hard d'un compte (admin moderation,
-- RGPD complet par admin) reussit. Le RGPD utilisateur (delete_my_account)
-- continue d'anonymiser sans suppression hard, donc shared_by reste pointe
-- pour traçabilite metier.
ALTER TABLE public.missions
  DROP CONSTRAINT IF EXISTS missions_shared_by_fkey;

ALTER TABLE public.missions
  ADD CONSTRAINT missions_shared_by_fkey
  FOREIGN KEY (shared_by) REFERENCES public.drivers(id)
  ON DELETE SET NULL;
