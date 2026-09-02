-- A medication is identified by its drug; the separate display name is obsolete.
ALTER TABLE medicamentos RENAME TO medicamentos_source_0004;
ALTER TABLE medicamentos_stock RENAME TO medicamentos_stock_source_0004;

CREATE TABLE medicamentos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
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

INSERT INTO medicamentos (id, droga_id, fecha_vencimiento, marca_id, presentacion_id, created_at, updated_at)
SELECT id, droga_id, fecha_vencimiento, marca_id, presentacion_id, created_at, updated_at
FROM medicamentos_source_0004;

INSERT INTO medicamentos_stock (medicamento_id, ubicacion_id, cantidad)
SELECT medicamento_id, ubicacion_id, cantidad
FROM medicamentos_stock_source_0004;

DROP TABLE medicamentos_stock_source_0004;
DROP TABLE medicamentos_source_0004;
