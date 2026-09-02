-- Each dose belongs to exactly one presentation.
ALTER TABLE medicamentos RENAME TO medicamentos_source_0005;
ALTER TABLE medicamentos_stock RENAME TO medicamentos_stock_source_0005;
ALTER TABLE presentaciones RENAME TO presentaciones_source_0005;
ALTER TABLE dosis RENAME TO dosis_source_0005;

CREATE TABLE presentaciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL CHECK(length(trim(name)) > 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE dosis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL CHECK(length(trim(name)) > 0),
  presentacion_id INTEGER NOT NULL REFERENCES presentaciones(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Former rows with the same presentation name are consolidated. Their doses
-- remain independent records associated with the canonical presentation.
INSERT INTO presentaciones (id, name, created_at, updated_at)
SELECT MIN(id), trim(name), MIN(created_at), MAX(updated_at)
FROM presentaciones_source_0005
GROUP BY lower(trim(name));

INSERT INTO dosis (id, name, presentacion_id, created_at, updated_at)
SELECT p.id, d.name,
  (SELECT MIN(p2.id) FROM presentaciones_source_0005 p2
   WHERE lower(trim(p2.name)) = lower(trim(p.name))),
  p.created_at, p.updated_at
FROM presentaciones_source_0005 p
JOIN dosis_source_0005 d ON d.id = p.dosis_id;

CREATE TABLE medicamentos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  droga_id INTEGER NOT NULL REFERENCES drogas(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  fecha_vencimiento TEXT NOT NULL,
  marca_id INTEGER NOT NULL REFERENCES marcas(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  presentacion_id INTEGER NOT NULL REFERENCES presentaciones(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  dosis_id INTEGER NOT NULL REFERENCES dosis(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TRIGGER medicamentos_dosis_presentacion_insert
BEFORE INSERT ON medicamentos
WHEN NOT EXISTS (
  SELECT 1 FROM dosis
  WHERE id = NEW.dosis_id AND presentacion_id = NEW.presentacion_id
)
BEGIN
  SELECT RAISE(ABORT, 'La dosis no pertenece a la presentación seleccionada');
END;

CREATE TRIGGER medicamentos_dosis_presentacion_update
BEFORE UPDATE OF dosis_id, presentacion_id ON medicamentos
WHEN NOT EXISTS (
  SELECT 1 FROM dosis
  WHERE id = NEW.dosis_id AND presentacion_id = NEW.presentacion_id
)
BEGIN
  SELECT RAISE(ABORT, 'La dosis no pertenece a la presentación seleccionada');
END;

INSERT INTO medicamentos (id, droga_id, fecha_vencimiento, marca_id, presentacion_id, dosis_id, created_at, updated_at)
SELECT m.id, m.droga_id, m.fecha_vencimiento, m.marca_id,
  (SELECT MIN(p2.id) FROM presentaciones_source_0005 p2
   WHERE lower(trim(p2.name)) = lower(trim(p.name))),
  m.presentacion_id, m.created_at, m.updated_at
FROM medicamentos_source_0005 m
JOIN presentaciones_source_0005 p ON p.id = m.presentacion_id;

CREATE TABLE medicamentos_stock (
  medicamento_id INTEGER NOT NULL REFERENCES medicamentos(id) ON UPDATE CASCADE ON DELETE CASCADE,
  ubicacion_id INTEGER NOT NULL REFERENCES ubicaciones(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  cantidad INTEGER NOT NULL CHECK(cantidad >= 0),
  PRIMARY KEY (medicamento_id, ubicacion_id)
);

INSERT INTO medicamentos_stock SELECT medicamento_id, ubicacion_id, cantidad
FROM medicamentos_stock_source_0005;

-- Retain old doses that had no presentation for audit/recovery purposes.
CREATE TABLE dosis_sin_presentacion_legacy_0005 AS
SELECT d.* FROM dosis_source_0005 d
WHERE NOT EXISTS (SELECT 1 FROM presentaciones_source_0005 p WHERE p.dosis_id = d.id);

DROP TABLE medicamentos_stock_source_0005;
DROP TABLE medicamentos_source_0005;
DROP TABLE presentaciones_source_0005;
DROP TABLE dosis_source_0005;
