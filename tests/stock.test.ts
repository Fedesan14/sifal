import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import test from 'node:test'
import { safeHandler } from '../src/main/ipc/handler'
import { formatExpirationMonthInput } from '../src/shared/formatters'
import { biomedicalSupplyInputSchema, medicamentoInputSchema, ubicacionInputSchema } from '../src/shared/validation/schemas'

const timestamp = '2026-01-01T00:00:00.000Z'
const migrations = path.join(process.cwd(), 'src/main/database/migrations')
const files = ['0001_normalized_stock.sql', '0002_split_drugs_and_medications.sql', '0003_add_medication_name.sql', '0004_location_stock.sql', '0005_remove_medication_name.sql', '0006_dose_by_presentation.sql', '0007_biomedical_location_stock.sql', '0008_expiration_month.sql', '0009_expiration_month_display.sql']

test('el vencimiento agrega la barra automáticamente y permite corregirlo', () => {
  assert.equal(formatExpirationMonthInput('0', ''), '0')
  assert.equal(formatExpirationMonthInput('02', '0'), '02/')
  assert.equal(formatExpirationMonthInput('02/2027', '02/202'), '02/2027')
  assert.equal(formatExpirationMonthInput('022027', ''), '02/2027')
  assert.equal(formatExpirationMonthInput('02', '02/'), '02')
})

test('el vencimiento informa el formato MM/YYYY', () => {
  const result = biomedicalSupplyInputSchema.safeParse({ name: 'Catéter', expirationDate: '2027-02', stocks: [] })
  assert.equal(result.success, false)
  if (!result.success) assert.equal(result.error.issues[0]?.message, 'El vencimiento debe tener formato MM/YYYY')
})

function setup(upTo = files.at(-1)): DatabaseSync {
  const db = new DatabaseSync(':memory:')
  db.exec('PRAGMA foreign_keys = ON')
  for (const file of files) {
    db.exec(fs.readFileSync(path.join(migrations, file), 'utf8'))
    if (file === upTo) break
  }
  return db
}

function insertNamed(db: DatabaseSync, table: 'grupos' | 'marcas' | 'dosis', name: string): number {
  return Number(db.prepare(`INSERT INTO ${table} (name, created_at, updated_at) VALUES (?, ?, ?)`).run(name, timestamp, timestamp).lastInsertRowid)
}

function seedCatalog(db: DatabaseSync) {
  const grupoId = insertNamed(db, 'grupos', 'Antibióticos')
  const marcaId = insertNamed(db, 'marcas', 'Marca A')
  const drogaId = Number(db.prepare('INSERT INTO drogas (name, grupo_id, created_at, updated_at) VALUES (?, ?, ?, ?)').run('Amoxicilina', grupoId, timestamp, timestamp).lastInsertRowid)
  const presentacionId = Number(db.prepare('INSERT INTO presentaciones (name, created_at, updated_at) VALUES (?, ?, ?)').run('Comprimidos', timestamp, timestamp).lastInsertRowid)
  const dosisId = Number(db.prepare('INSERT INTO dosis (name, presentacion_id, created_at, updated_at) VALUES (?, ?, ?, ?)').run('500 mg', presentacionId, timestamp, timestamp).lastInsertRowid)
  return { marcaId, drogaId, presentacionId, dosisId }
}

function seedLegacyCatalog(db: DatabaseSync) {
  const grupoId = insertNamed(db, 'grupos', 'Antibióticos')
  const marcaId = insertNamed(db, 'marcas', 'Marca A')
  const dosisId = insertNamed(db, 'dosis', '500 mg')
  const drogaId = Number(db.prepare('INSERT INTO drogas (name, grupo_id, created_at, updated_at) VALUES (?, ?, ?, ?)').run('Amoxicilina', grupoId, timestamp, timestamp).lastInsertRowid)
  const presentacionId = Number(db.prepare('INSERT INTO presentaciones (name, dosis_id, created_at, updated_at) VALUES (?, ?, ?, ?)').run('Comprimidos', dosisId, timestamp, timestamp).lastInsertRowid)
  return { marcaId, drogaId, presentacionId }
}

test('el stock total es la suma del medicamento en todas sus ubicaciones', () => {
  const db = setup()
  try {
    const ids = seedCatalog(db)
    const location1 = Number(db.prepare('INSERT INTO ubicaciones (nombre, created_at, updated_at) VALUES (?, ?, ?)').run('TAQUILLA 1', timestamp, timestamp).lastInsertRowid)
    const location2 = Number(db.prepare('INSERT INTO ubicaciones (nombre, created_at, updated_at) VALUES (?, ?, ?)').run('QUIRÓFANO', timestamp, timestamp).lastInsertRowid)
    const medication = Number(db.prepare('INSERT INTO medicamentos (droga_id, fecha_vencimiento, marca_id, presentacion_id, dosis_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(ids.drogaId, '2028-01-01', ids.marcaId, ids.presentacionId, ids.dosisId, timestamp, timestamp).lastInsertRowid)
    db.prepare('INSERT INTO medicamentos_stock VALUES (?, ?, ?)').run(medication, location1, 12)
    db.prepare('INSERT INTO medicamentos_stock VALUES (?, ?, ?)').run(medication, location2, 8)
    const result = db.prepare('SELECT SUM(cantidad) AS total FROM medicamentos_stock WHERE medicamento_id = ?').get(medication)
    assert.equal(result?.total, 20)
    assert.throws(() => db.prepare('INSERT INTO medicamentos_stock VALUES (?, ?, ?)').run(medication, location1, 1))
    assert.throws(() => db.prepare('DELETE FROM ubicaciones WHERE id = ?').run(location1))
    db.prepare('DELETE FROM medicamentos WHERE id = ?').run(medication)
    assert.equal(db.prepare('SELECT COUNT(*) AS amount FROM medicamentos_stock').get()?.amount, 0)
  } finally { db.close() }
})

test('0004 conserva el stock y convierte la ubicación a nombre simple', () => {
  const db = setup('0003_add_medication_name.sql')
  try {
    const ids = seedLegacyCatalog(db)
    const location = Number(db.prepare('INSERT INTO ubicaciones (tipo, nombre, numero, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run('TAQUILLA', 'Enfermería', 4, timestamp, timestamp).lastInsertRowid)
    db.prepare('INSERT INTO medicamentos (name, droga_id, cantidad, fecha_vencimiento, marca_id, presentacion_id, ubicacion_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run('Amoxidal', ids.drogaId, 17, '2028-01-01', ids.marcaId, ids.presentacionId, location, timestamp, timestamp)
    db.exec(fs.readFileSync(path.join(migrations, '0004_location_stock.sql'), 'utf8'))
    assert.equal(db.prepare('SELECT nombre FROM ubicaciones').get()?.nombre, 'Enfermería 4')
    assert.equal(db.prepare('SELECT cantidad FROM medicamentos_stock').get()?.cantidad, 17)
    const columns = db.prepare('PRAGMA table_info(medicamentos)').all().map((column) => column.name)
    assert.equal(columns.includes('cantidad'), false)
  } finally { db.close() }
})

test('los payloads permiten omitir el stock y rechazan ubicaciones duplicadas', () => {
  const valid = { drogaId: 1, fechaVencimiento: '01/2028', marcaId: 1, presentacionId: 1, dosisId: 1, stocks: [{ ubicacionId: 1, cantidad: 2 }, { ubicacionId: 2, cantidad: 3 }] }
  assert.equal(medicamentoInputSchema.safeParse(valid).success, true)
  assert.equal(medicamentoInputSchema.safeParse({ ...valid, fechaVencimiento: '2028-01-31' }).success, false)
  assert.equal(medicamentoInputSchema.safeParse({ ...valid, fechaVencimiento: '13/2028' }).success, false)
  assert.equal(medicamentoInputSchema.safeParse({ ...valid, stocks: [] }).success, true)
  assert.equal(medicamentoInputSchema.safeParse({ ...valid, stocks: [{ ubicacionId: 1, cantidad: 2 }, { ubicacionId: 1, cantidad: 3 }] }).success, false)
  assert.equal(ubicacionInputSchema.safeParse({ nombre: 'PAÑOL FARMACIA' }).success, true)
  assert.equal(ubicacionInputSchema.safeParse({ tipo: 'PANOL', nombre: 'Farmacia' }).success, false)
  const biomedical = { name: 'Catéter', expirationDate: '01/2028', stocks: [{ ubicacionId: 1, cantidad: 4 }] }
  assert.equal(biomedicalSupplyInputSchema.safeParse(biomedical).success, true)
  assert.equal(biomedicalSupplyInputSchema.safeParse({ ...biomedical, stocks: [{ ubicacionId: 1, cantidad: 4 }, { ubicacionId: 1, cantidad: 2 }] }).success, false)
})

test('el stock biomédico se distribuye entre las ubicaciones compartidas', () => {
  const db = setup()
  try {
    const location1 = Number(db.prepare('INSERT INTO ubicaciones (nombre, created_at, updated_at) VALUES (?, ?, ?)').run('FARMACIA', timestamp, timestamp).lastInsertRowid)
    const location2 = Number(db.prepare('INSERT INTO ubicaciones (nombre, created_at, updated_at) VALUES (?, ?, ?)').run('QUIRÓFANO', timestamp, timestamp).lastInsertRowid)
    const supply = Number(db.prepare('INSERT INTO biomedical_supplies (name, expiration_date, created_at, updated_at) VALUES (?, ?, ?, ?)').run('Catéter', '2028-01-01', timestamp, timestamp).lastInsertRowid)
    db.prepare('INSERT INTO biomedical_supplies_stock VALUES (?, ?, ?)').run(supply, location1, 3)
    db.prepare('INSERT INTO biomedical_supplies_stock VALUES (?, ?, ?)').run(supply, location2, 5)
    assert.equal(db.prepare('SELECT SUM(cantidad) AS total FROM biomedical_supplies_stock WHERE biomedical_supply_id = ?').get(supply)?.total, 8)
    assert.throws(() => db.prepare('INSERT INTO biomedical_supplies_stock VALUES (?, ?, ?)').run(supply, location1, 1))
    assert.throws(() => db.prepare('DELETE FROM ubicaciones WHERE id = ?').run(location1))
    db.prepare('DELETE FROM biomedical_supplies WHERE id = ?').run(supply)
    assert.equal(db.prepare('SELECT COUNT(*) AS amount FROM biomedical_supplies_stock').get()?.amount, 0)
  } finally { db.close() }
})

test('0007 conserva los biomédicos del modelo anterior', () => {
  const db = setup('0006_dose_by_presentation.sql')
  try {
    db.exec('CREATE TABLE biomedical_supplies (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, quantity INTEGER NOT NULL, expiration_date TEXT NOT NULL, location TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)')
    db.prepare('INSERT INTO biomedical_supplies (name, quantity, expiration_date, location, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)').run('Catéter', 6, '2028-01-01', 'QUIRÓFANO', timestamp, timestamp)
    db.exec(fs.readFileSync(path.join(migrations, '0007_biomedical_location_stock.sql'), 'utf8'))
    assert.equal(db.prepare('SELECT name FROM biomedical_supplies').get()?.name, 'Catéter')
    assert.deepEqual({ ...db.prepare('SELECT location.nombre, stock.cantidad FROM biomedical_supplies_stock stock JOIN ubicaciones location ON location.id = stock.ubicacion_id').get() }, { nombre: 'QUIRÓFANO', cantidad: 6 })
    const columns = db.prepare('PRAGMA table_info(biomedical_supplies)').all().map((column) => column.name)
    assert.equal(columns.includes('quantity'), false)
    assert.equal(columns.includes('location'), false)
  } finally { db.close() }
})

test('0008 convierte los vencimientos existentes a mes y año', () => {
  const db = setup('0007_biomedical_location_stock.sql')
  try {
    const ids = seedCatalog(db)
    db.prepare('INSERT INTO medicamentos (droga_id, fecha_vencimiento, marca_id, presentacion_id, dosis_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(ids.drogaId, '2028-06-30', ids.marcaId, ids.presentacionId, ids.dosisId, timestamp, timestamp)
    db.prepare('INSERT INTO biomedical_supplies (name, expiration_date, created_at, updated_at) VALUES (?, ?, ?, ?)').run('Catéter', '2029-04-15', timestamp, timestamp)
    db.exec(fs.readFileSync(path.join(migrations, '0008_expiration_month.sql'), 'utf8'))
    assert.equal(db.prepare('SELECT fecha_vencimiento FROM medicamentos').get()?.fecha_vencimiento, '2028-06')
    assert.equal(db.prepare('SELECT expiration_date FROM biomedical_supplies').get()?.expiration_date, '2029-04')
  } finally { db.close() }
})

test('0009 presenta los vencimientos como MM/AAAA', () => {
  const db = setup('0008_expiration_month.sql')
  try {
    const ids = seedCatalog(db)
    db.prepare('INSERT INTO medicamentos (droga_id, fecha_vencimiento, marca_id, presentacion_id, dosis_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(ids.drogaId, '2028-06', ids.marcaId, ids.presentacionId, ids.dosisId, timestamp, timestamp)
    db.prepare('INSERT INTO biomedical_supplies (name, expiration_date, created_at, updated_at) VALUES (?, ?, ?, ?)').run('Catéter', '2029-04', timestamp, timestamp)
    db.exec(fs.readFileSync(path.join(migrations, '0009_expiration_month_display.sql'), 'utf8'))
    assert.equal(db.prepare('SELECT fecha_vencimiento FROM medicamentos').get()?.fecha_vencimiento, '06/2028')
    assert.equal(db.prepare('SELECT expiration_date FROM biomedical_supplies').get()?.expiration_date, '04/2029')
  } finally { db.close() }
})

test('IPC devuelve el detalle de los campos inválidos', async () => {
  const result = await safeHandler(() => medicamentoInputSchema.parse({ drogaId: 0, fechaVencimiento: 'inválida', marcaId: 1, presentacionId: 1, dosisId: 1, stocks: [] }))
  assert.equal(result.ok, false)
  if (!result.ok) {
    assert.equal(result.error.code, 'VALIDATION_ERROR')
    assert.ok(result.error.details?.drogaId)
    assert.equal(result.error.details?.stocks, undefined)
  }
})

test('0005 elimina el nombre del medicamento y conserva su stock', () => {
  const db = setup('0004_location_stock.sql')
  try {
    const ids = seedLegacyCatalog(db)
    const location = Number(db.prepare('INSERT INTO ubicaciones (nombre, created_at, updated_at) VALUES (?, ?, ?)').run('FARMACIA', timestamp, timestamp).lastInsertRowid)
    const medication = Number(db.prepare('INSERT INTO medicamentos (name, droga_id, fecha_vencimiento, marca_id, presentacion_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run('Nombre anterior', ids.drogaId, '2028-01-01', ids.marcaId, ids.presentacionId, timestamp, timestamp).lastInsertRowid)
    db.prepare('INSERT INTO medicamentos_stock VALUES (?, ?, ?)').run(medication, location, 9)
    db.exec(fs.readFileSync(path.join(migrations, '0005_remove_medication_name.sql'), 'utf8'))
    const columns = db.prepare('PRAGMA table_info(medicamentos)').all().map((column) => column.name)
    assert.equal(columns.includes('name'), false)
    assert.equal(db.prepare('SELECT cantidad FROM medicamentos_stock').get()?.cantidad, 9)
  } finally { db.close() }
})

test('0006 hace que cada dosis pertenezca a una presentación', () => {
  const db = setup('0005_remove_medication_name.sql')
  try {
    const ids = seedLegacyCatalog(db)
    const secondDose = insertNamed(db, 'dosis', '250 mg')
    db.prepare('INSERT INTO presentaciones (name, dosis_id, created_at, updated_at) VALUES (?, ?, ?, ?)').run(' comprimidos ', secondDose, timestamp, timestamp)
    const location = Number(db.prepare('INSERT INTO ubicaciones (nombre, created_at, updated_at) VALUES (?, ?, ?)').run('FARMACIA', timestamp, timestamp).lastInsertRowid)
    const medication = Number(db.prepare('INSERT INTO medicamentos (droga_id, fecha_vencimiento, marca_id, presentacion_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)').run(ids.drogaId, '2028-01-01', ids.marcaId, ids.presentacionId, timestamp, timestamp).lastInsertRowid)
    db.prepare('INSERT INTO medicamentos_stock VALUES (?, ?, ?)').run(medication, location, 7)
    db.exec(fs.readFileSync(path.join(migrations, '0006_dose_by_presentation.sql'), 'utf8'))
    const dose = db.prepare('SELECT name, presentacion_id FROM dosis').get()
    assert.deepEqual({ ...dose }, { name: '500 mg', presentacion_id: ids.presentacionId })
    assert.equal(db.prepare('SELECT COUNT(*) AS amount FROM presentaciones').get()?.amount, 1)
    assert.equal(db.prepare('SELECT COUNT(*) AS amount FROM dosis WHERE presentacion_id = ?').get(ids.presentacionId)?.amount, 2)
    const migrated = db.prepare('SELECT presentacion_id, dosis_id FROM medicamentos').get()
    assert.deepEqual({ ...migrated }, { presentacion_id: ids.presentacionId, dosis_id: ids.presentacionId })
    assert.equal(db.prepare('SELECT cantidad FROM medicamentos_stock').get()?.cantidad, 7)
    const otherPresentation = Number(db.prepare('INSERT INTO presentaciones (name, created_at, updated_at) VALUES (?, ?, ?)').run('Ampolla', timestamp, timestamp).lastInsertRowid)
    assert.throws(() => db.prepare('UPDATE medicamentos SET presentacion_id = ? WHERE id = ?').run(otherPresentation, medication))
  } finally { db.close() }
})
