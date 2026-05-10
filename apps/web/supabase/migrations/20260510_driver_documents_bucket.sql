-- Bucket privé `driver-documents` pour les pièces administratives des
-- chauffeurs (permis, carte pro, carte grise, assurance, contrôle technique).
-- Le code TS upload sur ce bucket depuis le 2026-03 mais le bucket n'avait
-- jamais été créé en prod -> tous les uploads échouaient silencieusement
-- (table driver_documents = 0 row le 2026-05-10).
--
-- Le bucket est PRIVÉ : la lecture passe par createSignedUrl(path, ttl)
-- généré server-side ou via le service-role pour l'admin dashboard.
-- Chaque chauffeur ne peut écrire/lire QUE dans son propre dossier
-- `${auth.uid()}/...`.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'driver-documents',
  'driver-documents',
  false,
  10485760, -- 10 MB
  array['application/pdf', 'image/jpeg', 'image/png']
)
on conflict (id) do nothing;

-- Lecture : chauffeur lit ses propres fichiers (le 1er segment du path doit
-- correspondre a son UID). Le service-role bypasse RLS et reste disponible
-- pour l'admin dashboard.
drop policy if exists "driver-documents read own" on storage.objects;
create policy "driver-documents read own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'driver-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Upload : meme regle (ecrit dans son dossier).
drop policy if exists "driver-documents insert own" on storage.objects;
create policy "driver-documents insert own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'driver-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Update : pour le upsert: true du SDK (overwrite d'un fichier existant).
drop policy if exists "driver-documents update own" on storage.objects;
create policy "driver-documents update own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'driver-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'driver-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Delete : permet au chauffeur de supprimer ses propres fichiers (pas
-- expose dans l'UI actuelle mais utile pour le RGPD/anonymisation compte).
drop policy if exists "driver-documents delete own" on storage.objects;
create policy "driver-documents delete own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'driver-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
