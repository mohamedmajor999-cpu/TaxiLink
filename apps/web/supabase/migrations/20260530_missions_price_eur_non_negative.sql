-- P0-4 (prix) : empeche un prix negatif / absurde cote serveur, SANS plafond
-- (decision produit 2026-05-30 : une course CPAM longue distance peut depasser
-- 500 €, donc pas de borne haute). Le mobile n'est plus seul juge : la base
-- refuse desormais un prix < 0. NULL reste autorise (prix non encore fixe).
--
-- PRE-REQUIS AVANT APPLICATION : verifier qu'aucune ligne existante ne viole la
-- contrainte, sinon la migration echoue :
--   select count(*) from public.missions where price_eur < 0;
-- (doit renvoyer 0)

ALTER TABLE public.missions
  ADD CONSTRAINT missions_price_eur_non_negative
  CHECK (price_eur IS NULL OR price_eur >= 0);
