-- Remplace la policy UPDATE unique sur `missions` par 3 policies distinctes.
-- Bug corrige : seul le createur pouvait "accepter" sa propre annonce, parce que
-- l'ancienne policy exigeait (driver_id = auth.uid() OR client_id = auth.uid()).
-- Pour une mission AVAILABLE, driver_id est NULL, donc seul le client passait.
--
-- Nouvelles policies :
-- 1) Acceptation : tout authentifie peut passer AVAILABLE -> IN_PROGRESS
--    a condition de se mettre lui-meme en driver_id (WITH CHECK).
-- 2) Gestion chauffeur : le driver assigne peut modifier/annuler/terminer.
-- 3) Edition auteur : le createur peut editer sa mission tant qu'elle est AVAILABLE.

DROP POLICY IF EXISTS "Mise à jour mission driver" ON missions;

CREATE POLICY "Acceptation mission disponible" ON missions
  FOR UPDATE TO authenticated
  USING (status = 'AVAILABLE' AND driver_id IS NULL)
  WITH CHECK (driver_id = auth.uid() AND status = 'IN_PROGRESS');

CREATE POLICY "Gestion mission chauffeur" ON missions
  FOR UPDATE TO authenticated
  USING (driver_id = auth.uid())
  WITH CHECK (driver_id = auth.uid() OR driver_id IS NULL);

CREATE POLICY "Edition mission auteur" ON missions
  FOR UPDATE TO authenticated
  USING (client_id = auth.uid() AND status = 'AVAILABLE')
  WITH CHECK (client_id = auth.uid());
