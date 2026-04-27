-- Compteur de vues par mission, agrege.
--
-- Pourquoi : un chauffeur qui partage une course ne sait pas si elle est vue
-- ou pas. Sur WhatsApp il a au moins les "vus". Resultat : retour sur WhatsApp,
-- abandon de TaxiLink. Affichage agrege uniquement (« 12 vues »), pas nominatif
-- (pas de fuite RGPD du qui-a-vu-quand).
--
-- Design : table de detail mission_views (unique par viewer) + colonne
-- view_count cached sur missions, maintenue par trigger. Le COUNT(*) repete
-- sur mission_views serait trop cher a chaque rendu de la liste postee.

CREATE TABLE IF NOT EXISTS mission_views (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id  UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  viewer_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (mission_id, viewer_id)
);

CREATE INDEX IF NOT EXISTS mission_views_mission_idx ON mission_views(mission_id);

ALTER TABLE missions
  ADD COLUMN IF NOT EXISTS view_count INT NOT NULL DEFAULT 0;

-- Trigger : a chaque nouvelle ligne dans mission_views (insertion unique
-- garantie par la contrainte UNIQUE), on incremente view_count.
CREATE OR REPLACE FUNCTION increment_mission_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE missions SET view_count = view_count + 1 WHERE id = NEW.mission_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS mission_views_increment ON mission_views;
CREATE TRIGGER mission_views_increment
  AFTER INSERT ON mission_views
  FOR EACH ROW
  EXECUTE FUNCTION increment_mission_view_count();

-- RLS : tout chauffeur authentifie peut INSERT (un viewer enregistre sa propre
-- vue), mais pas SELECT — le decompte agrege passe par missions.view_count
-- qui est lui-meme couvert par les RLS missions existantes.
ALTER TABLE mission_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mission_views_insert ON mission_views;
CREATE POLICY mission_views_insert
  ON mission_views FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = viewer_id);

-- Pas de SELECT policy : meme l'auteur de la mission ne voit pas qui a vu —
-- conforme a la decision UX/RGPD (compteur agrege uniquement).
