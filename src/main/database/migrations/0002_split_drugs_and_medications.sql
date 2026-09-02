-- Preserve the 0001 stock rows, then split drug catalog data from stock data.
ALTER TABLE drogas RENAME TO drogas_stock_source_0001;

CREATE TABLE drogas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL CHECK(length(trim(name)) > 0),
  grupo_id INTEGER NOT NULL REFERENCES grupos(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT INTO drogas (id, name, grupo_id, created_at, updated_at)
SELECT id, name, grupo_id, created_at, updated_at
FROM drogas_stock_source_0001;

CREATE TABLE medicamentos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  droga_id INTEGER NOT NULL REFERENCES drogas(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  cantidad INTEGER NOT NULL CHECK(cantidad >= 0),
  fecha_vencimiento TEXT NOT NULL,
  marca_id INTEGER NOT NULL REFERENCES marcas(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  presentacion_id INTEGER NOT NULL REFERENCES presentaciones(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  ubicacion_id INTEGER NOT NULL REFERENCES ubicaciones(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT INTO medicamentos (
  id, droga_id, cantidad, fecha_vencimiento, marca_id,
  presentacion_id, ubicacion_id, created_at, updated_at
)
SELECT
  id, id, cantidad, fecha_vencimiento, marca_id,
  presentacion_id, ubicacion_id, created_at, updated_at
FROM drogas_stock_source_0001;

-- Keep a read-only-style archival copy without foreign keys, so historical
-- rows do not block valid deletes in the new normalized model.
CREATE TABLE drogas_stock_legacy_0001 (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  cantidad INTEGER NOT NULL,
  fecha_vencimiento TEXT NOT NULL,
  grupo_id INTEGER NOT NULL,
  marca_id INTEGER NOT NULL,
  presentacion_id INTEGER NOT NULL,
  ubicacion_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT INTO drogas_stock_legacy_0001
SELECT * FROM drogas_stock_source_0001;

DROP TABLE drogas_stock_source_0001;
