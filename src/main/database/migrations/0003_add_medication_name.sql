-- Medication has its own display name, independent from its drug.
ALTER TABLE medicamentos RENAME TO medicamentos_source_0002;

CREATE TABLE medicamentos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL CHECK(length(trim(name)) > 0),
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
  id, name, droga_id, cantidad, fecha_vencimiento, marca_id,
  presentacion_id, ubicacion_id, created_at, updated_at
)
SELECT
  m.id, d.name, m.droga_id, m.cantidad, m.fecha_vencimiento, m.marca_id,
  m.presentacion_id, m.ubicacion_id, m.created_at, m.updated_at
FROM medicamentos_source_0002 m
JOIN drogas d ON d.id = m.droga_id;

DROP TABLE medicamentos_source_0002;
