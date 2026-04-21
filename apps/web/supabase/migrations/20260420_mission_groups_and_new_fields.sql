-- Nouveaux champs d'annonce + relation many-to-many missions <-> groups
--
-- Ajoute :
--   * return_trip    (BOOLEAN) : aller-retour CPAM
--   * return_time    (TIME)    : heure de retour si A/R
--   * transport_type (TEXT)    : SEATED | WHEELCHAIR | STRETCHER (CPAM)
--   * companion      (BOOLEAN) : accompagnant
--   * passengers     (INT)     : nombre de passagers (privé)
--
-- Remplace la colonne `group_id` (1 seul groupe) par une table de liaison
-- `mission_groups` permettant de partager une annonce avec plusieurs groupes.

-- 1. Nouveaux champs métier
ALTER TABLE missions
  ADD COLUMN IF NOT EXISTS return_trip    BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS return_time    TIME,
  ADD COLUMN IF NOT EXISTS transport_type TEXT,
  ADD COLUMN IF NOT EXISTS companion      BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS passengers     INTEGER;

ALTER TABLE missions
  DROP CONSTRAINT IF EXISTS missions_transport_type_check;
ALTER TABLE missions
  ADD CONSTRAINT missions_transport_type_check
  CHECK (transport_type IS NULL OR transport_type IN ('SEATED', 'WHEELCHAIR', 'STRETCHER'));

ALTER TABLE missions
  DROP CONSTRAINT IF EXISTS missions_passengers_check;
ALTER TABLE missions
  ADD CONSTRAINT missions_passengers_check
  CHECK (passengers IS NULL OR (passengers > 0 AND passengers <= 8));

-- 2. Table de liaison missions <-> groups (many-to-many)
CREATE TABLE IF NOT EXISTS mission_groups (
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  group_id   UUID NOT NULL REFERENCES groups(id)   ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (mission_id, group_id)
);

CREATE INDEX IF NOT EXISTS mission_groups_group_id_idx ON mission_groups(group_id);

-- 3. Migration des données existantes : missions.group_id -> mission_groups
INSERT INTO mission_groups (mission_id, group_id)
SELECT id, group_id
FROM missions
WHERE group_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 4. Suppression de l'ancienne colonne mono-groupe
ALTER TABLE missions DROP COLUMN IF EXISTS group_id;

-- 5. RLS : mission_groups suit la policy de missions (lecture publique si AVAILABLE,
--    écriture réservée au créateur). On s'aligne sur le pattern groups / group_members.
ALTER TABLE mission_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mission_groups_select" ON mission_groups;
CREATE POLICY "mission_groups_select"
  ON mission_groups FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "mission_groups_insert" ON mission_groups;
CREATE POLICY "mission_groups_insert"
  ON mission_groups FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM missions m
      WHERE m.id = mission_id
      AND m.shared_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "mission_groups_delete" ON mission_groups;
CREATE POLICY "mission_groups_delete"
  ON mission_groups FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM missions m
      WHERE m.id = mission_id
      AND m.shared_by = auth.uid()
    )
  );
