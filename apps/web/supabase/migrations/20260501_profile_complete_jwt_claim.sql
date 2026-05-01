-- Stocke `profile_complete` et `role` dans `auth.users.raw_app_meta_data` pour
-- qu'ils soient inclus dans le JWT. Le middleware peut alors lire ces infos
-- directement depuis le token (decode local, ~1ms) au lieu de requeter la
-- table `profiles` a chaque navigation (~150-400ms).
--
-- IMPORTANT : pour que getClaims() fasse une verification 100% locale (sans
-- aller-retour reseau), le projet Supabase doit utiliser des cles JWT
-- asymetriques (RS256/ES256). A activer dans : Dashboard Supabase >
-- Settings > Auth > JWT Settings > "Use asymmetric JWT signing keys".
-- Sans ca, getClaims() fallback sur getUser() et on perd le gain.

create or replace function public.sync_profile_claims_to_auth()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  is_complete boolean;
begin
  is_complete :=
    coalesce(length(trim(NEW.first_name)), 0) > 0
    and coalesce(length(trim(NEW.last_name)), 0) > 0
    and coalesce(length(trim(NEW.phone)), 0) > 0;

  -- Merge dans raw_app_meta_data sans ecraser les autres claims existants.
  -- raw_app_meta_data n'est modifiable que via service_role ou trigger
  -- security definer comme ici, donc le client ne peut pas le forger.
  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object(
      'profile_complete', is_complete,
      'role',             NEW.role
    )
  where id = NEW.id;

  return NEW;
end;
$$;

drop trigger if exists profiles_sync_claims on public.profiles;
create trigger profiles_sync_claims
  after insert or update of first_name, last_name, phone, role
  on public.profiles
  for each row
  execute function public.sync_profile_claims_to_auth();

-- Backfill : initialise les claims pour tous les profils existants.
-- Les sessions deja ouvertes recevront les nouveaux claims a la prochaine
-- rotation de token (auto-refresh ~1h) ou au prochain login.
update auth.users u
set raw_app_meta_data = coalesce(u.raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object(
    'profile_complete',
      coalesce(length(trim(p.first_name)), 0) > 0
      and coalesce(length(trim(p.last_name)), 0) > 0
      and coalesce(length(trim(p.phone)), 0) > 0,
    'role', p.role
  )
from public.profiles p
where p.id = u.id;
