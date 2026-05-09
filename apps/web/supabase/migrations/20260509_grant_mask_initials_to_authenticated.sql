-- Fix régression migration 20260507_revoke_internal_function_execute.sql
--
-- mask_initials(text) avait été classée comme "utilitaire interne" et REVOKE
-- FROM PUBLIC. Mais elle est invoquée depuis get_marketplace_missions(...) (et
-- la variante driver_blocks) qui sont en SECURITY INVOKER : Postgres exécute
-- alors mask_initials avec les droits de l'appelant authenticated → "permission
-- denied for function mask_initials" lors du reload du feed après publication.
--
-- mask_initials est une fonction pure (regex sur un nom, aucun accès table).
-- L'exposer à authenticated ne crée aucune fuite ; c'est au contraire requis
-- pour que le masquage RGPD côté serveur fonctionne.

BEGIN;

GRANT EXECUTE ON FUNCTION public.mask_initials(text) TO authenticated;

COMMIT;
