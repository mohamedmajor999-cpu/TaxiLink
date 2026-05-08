-- Cleanup final : retire la table missions de la publication supabase_realtime.
--
-- Tant que missions est dans cette publication, n'importe quel client
-- authentifie peut souscrire au pattern postgres_changes et recevoir le
-- payload brut de la ligne (incluant patient_name/phone/notes en clair). Le
-- pattern broadcast (cf. migration 20260507_missions_realtime_broadcast_no_pii.sql)
-- est en place mais ne remplace l'ancien que si on retire missions de la publication.
--
-- /!\ A APPLIQUER UNIQUEMENT APRES :
--   1. Le hook useMissionRealtime cote client est passe en mode broadcast
--      (commit deja merge sur master).
--   2. Le deploiement Vercel est sorti et active.
--   3. Les service workers PWA des chauffeurs sont mis a jour (peut prendre
--      jusqu'a 24h selon cache headers).
--
-- Effet immediat : les clients qui sont encore sur l'ancien code (cache PWA)
-- ne recevront plus d'events realtime. Ils continuent de fonctionner, juste
-- sans temps reel jusqu'a refresh.

ALTER PUBLICATION supabase_realtime DROP TABLE public.missions;
