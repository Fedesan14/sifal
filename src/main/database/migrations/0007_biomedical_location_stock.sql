-- Some early builds used this free-text table without recording its creation as
-- a migration. Creating it when absent lets the same migration handle both new
-- databases and databases that already contain biomedical records.
CREATE TABLE IF NOT EXISTS biomedical_supplies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK(quantity >= 0),
  expiration_date TEXT NOT NULL,
  location TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

ALTER TABLE biomedical_supplies RENAME TO biomedical_supplies_source_legacy;

CREATE TABLE biomedical_supplies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL CHECK(length(trim(name)) > 0),
  expiration_date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT INTO ubicaciones (nombre, created_at, updated_at)
SELECT trim(source.location), min(source.created_at), max(source.updated_at)
FROM biomedical_supplies_source_legacy source
WHERE length(trim(source.location)) > 0
  AND NOT EXISTS (
    SELECT 1 FROM ubicaciones existing
    WHERE existing.nombre = trim(source.location)
  )
GROUP BY trim(source.location);

INSERT INTO biomedical_supplies (id, name, expiration_date, created_at, updated_at)
SELECT id, name, expiration_date, created_at, updated_at
FROM biomedical_supplies_source_legacy;

CREATE TABLE biomedical_supplies_stock (
  biomedical_supply_id INTEGER NOT NULL REFERENCES biomedical_supplies(id) ON UPDATE CASCADE ON DELETE CASCADE,
  ubicacion_id INTEGER NOT NULL REFERENCES ubicaciones(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  cantidad INTEGER NOT NULL CHECK(cantidad >= 0),
  PRIMARY KEY (biomedical_supply_id, ubicacion_id)
);

INSERT INTO biomedical_supplies_stock (biomedical_supply_id, ubicacion_id, cantidad)
SELECT source.id, (
  SELECT min(location.id) FROM ubicaciones location
  WHERE location.nombre = trim(source.location)
), source.quantity
FROM biomedical_supplies_source_legacy source
WHERE length(trim(source.location)) > 0;

DROP TABLE biomedical_supplies_source_legacy;
