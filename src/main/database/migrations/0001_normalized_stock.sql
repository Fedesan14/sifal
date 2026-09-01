-- The legacy medications table is intentionally retained: its free-text fields
-- cannot be mapped safely to normalized entities without user-defined rules.
CREATE TABLE IF NOT EXISTS grupos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL CHECK(length(trim(name)) > 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS marcas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL CHECK(length(trim(name)) > 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS dosis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL CHECK(length(trim(name)) > 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS presentaciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL CHECK(length(trim(name)) > 0),
  dosis_id INTEGER NOT NULL REFERENCES dosis(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS ubicaciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT NOT NULL CHECK(tipo IN ('TAQUILLA', 'PANOL')),
  nombre TEXT NOT NULL CHECK(length(trim(nombre)) > 0),
  numero INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK((tipo = 'TAQUILLA' AND numero IS NOT NULL) OR (tipo = 'PANOL' AND numero IS NULL))
);
CREATE TABLE IF NOT EXISTS drogas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL CHECK(length(trim(name)) > 0),
  cantidad INTEGER NOT NULL CHECK(cantidad >= 0),
  fecha_vencimiento TEXT NOT NULL,
  grupo_id INTEGER NOT NULL REFERENCES grupos(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  marca_id INTEGER NOT NULL REFERENCES marcas(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  presentacion_id INTEGER NOT NULL REFERENCES presentaciones(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  ubicacion_id INTEGER NOT NULL REFERENCES ubicaciones(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
