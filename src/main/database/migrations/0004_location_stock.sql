-- A medication is catalog data. Its quantities belong to locations.
ALTER TABLE ubicaciones RENAME TO ubicaciones_source_0003;
ALTER TABLE medicamentos RENAME TO medicamentos_source_0003;

CREATE TABLE ubicaciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL CHECK(length(trim(nombre)) > 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT INTO ubicaciones (id, nombre, created_at, updated_at)
SELECT id,
  trim(nombre || CASE WHEN tipo = 'TAQUILLA' THEN ' ' || numero ELSE '' END),
  created_at, updated_at
FROM ubicaciones_source_0003;

CREATE TABLE medicamentos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL CHECK(length(trim(name)) > 0),
  droga_id INTEGER NOT NULL REFERENCES drogas(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  fecha_vencimiento TEXT NOT NULL,
  marca_id INTEGER NOT NULL REFERENCES marcas(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  presentacion_id INTEGER NOT NULL REFERENCES presentaciones(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE medicamentos_stock (
  medicamento_id INTEGER NOT NULL REFERENCES medicamentos(id) ON UPDATE CASCADE ON DELETE CASCADE,
  ubicacion_id INTEGER NOT NULL REFERENCES ubicaciones(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  cantidad INTEGER NOT NULL CHECK(cantidad >= 0),
  PRIMARY KEY (medicamento_id, ubicacion_id)
);

INSERT INTO medicamentos (id, name, droga_id, fecha_vencimiento, marca_id, presentacion_id, created_at, updated_at)
SELECT id, name, droga_id, fecha_vencimiento, marca_id, presentacion_id, created_at, updated_at
FROM medicamentos_source_0003;

INSERT INTO medicamentos_stock (medicamento_id, ubicacion_id, cantidad)
SELECT id, ubicacion_id, cantidad FROM medicamentos_source_0003;

DROP TABLE medicamentos_source_0003;
DROP TABLE ubicaciones_source_0003;
