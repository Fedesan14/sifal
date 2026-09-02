import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import test from 'node:test'
import { safeHandler } from '../src/main/ipc/handler'
import { drogaInputSchema, medicamentoInputSchema, namedEntityInputSchema, presentacionInputSchema, ubicacionInputSchema } from '../src/shared/validation/schemas'

const timestamp = '2026-01-01T00:00:00.000Z'
const migrations = path.join(process.cwd(), 'src/main/database/migrations')

function setup(upTo = '0003_add_medication_name.sql'): DatabaseSync {
  const db = new DatabaseSync(':memory:')
  db.exec('PRAGMA foreign_keys = ON')
  for (const file of ['0001_normalized_stock.sql', '0002_split_drugs_and_medications.sql', '0003_add_medication_name.sql']) {
    if (file > upTo) break
    db.exec(fs.readFileSync(path.join(migrations, file), 'utf8'))
  }
  return db
}

function insertNamed(db: DatabaseSync, table: 'grupos' | 'marcas' | 'dosis', name: string): number {
  return Number(db.prepare(`INSERT INTO ${table} (name, created_at, updated_at) VALUES (?, ?, ?)`).run(name, timestamp, timestamp).lastInsertRowid)
}

function seedRelations(db: DatabaseSync) {
  const grupoId = insertNamed(db, 'grupos', 'Antibióticos')
  const marcaId = insertNamed(db, 'marcas', 'Marca A')
  const dosisId = insertNamed(db, 'dosis', '500 mg')
  const drogaId = Number(db.prepare('INSERT INTO drogas (name, grupo_id, created_at, updated_at) VALUES (?, ?, ?, ?)').run('Amoxicilina', grupoId, timestamp, timestamp).lastInsertRowid)
  const presentacionId = Number(db.prepare('INSERT INTO presentaciones (name, dosis_id, created_at, updated_at) VALUES (?, ?, ?, ?)').run('Comprimidos', dosisId, timestamp, timestamp).lastInsertRowid)
  const ubicacionId = Number(db.prepare('INSERT INTO ubicaciones (tipo, nombre, numero, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run('TAQUILLA', 'Enfermería', 4, timestamp, timestamp).lastInsertRowid)
  return { grupoId, marcaId, dosisId, drogaId, presentacionId, ubicacionId }
}

test('Droga pertenece a Grupo y Medicamento selecciona Droga', () => {
  const db = setup()
  try {
    const ids = seedRelations(db)
    const medicamentoId = Number(db.prepare('INSERT INTO medicamentos (name, droga_id, cantidad, fecha_vencimiento, marca_id, presentacion_id, ubicacion_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run('Amoxidal 500', ids.drogaId, 20, '2028-06-30', ids.marcaId, ids.presentacionId, ids.ubicacionId, timestamp, timestamp).lastInsertRowid)
    const row = db.prepare('SELECT m.name, m.cantidad, d.name AS droga, g.name AS grupo FROM medicamentos m JOIN drogas d ON d.id = m.droga_id JOIN grupos g ON g.id = d.grupo_id WHERE m.id = ?').get(medicamentoId)
    assert.deepEqual({ ...row }, { name: 'Amoxidal 500', cantidad: 20, droga: 'Amoxicilina', grupo: 'Antibióticos' })

    db.prepare('UPDATE drogas SET name = ? WHERE id = ?').run('Amoxicilina actualizada', ids.drogaId)
    db.prepare('UPDATE medicamentos SET name = ?, cantidad = ? WHERE id = ?').run('Amoxidal Forte', 25, medicamentoId)
    assert.deepEqual({ ...db.prepare('SELECT name, cantidad FROM medicamentos WHERE id = ?').get(medicamentoId) }, { name: 'Amoxidal Forte', cantidad: 25 })
    assert.throws(() => db.prepare('DELETE FROM drogas WHERE id = ?').run(ids.drogaId))
    assert.throws(() => db.prepare('DELETE FROM grupos WHERE id = ?').run(ids.grupoId))

    db.prepare('DELETE FROM medicamentos WHERE id = ?').run(medicamentoId)
    db.prepare('DELETE FROM drogas WHERE id = ?').run(ids.drogaId)
    db.prepare('DELETE FROM grupos WHERE id = ?').run(ids.grupoId)
    db.prepare('DELETE FROM marcas WHERE id = ?').run(ids.marcaId)
    db.prepare('DELETE FROM ubicaciones WHERE id = ?').run(ids.ubicacionId)
    db.prepare('DELETE FROM presentaciones WHERE id = ?').run(ids.presentacionId)
    db.prepare('DELETE FROM dosis WHERE id = ?').run(ids.dosisId)
  } finally {
    db.close()
  }
})

test('impide referencias rotas y estados inválidos', () => {
  const db = setup()
  try {
    const ids = seedRelations(db)
    assert.throws(() => db.prepare('INSERT INTO drogas (name, grupo_id, created_at, updated_at) VALUES (?, ?, ?, ?)').run('X', 999, timestamp, timestamp))
    assert.throws(() => db.prepare('INSERT INTO medicamentos (name, droga_id, cantidad, fecha_vencimiento, marca_id, presentacion_id, ubicacion_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run('X', 999, 1, '2028-01-01', ids.marcaId, ids.presentacionId, ids.ubicacionId, timestamp, timestamp))
    assert.throws(() => db.prepare('INSERT INTO medicamentos (name, droga_id, cantidad, fecha_vencimiento, marca_id, presentacion_id, ubicacion_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run('X', ids.drogaId, -1, '2028-01-01', ids.marcaId, ids.presentacionId, ids.ubicacionId, timestamp, timestamp))
    assert.throws(() => db.prepare('INSERT INTO medicamentos (name, droga_id, cantidad, fecha_vencimiento, marca_id, presentacion_id, ubicacion_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run('', ids.drogaId, 1, '2028-01-01', ids.marcaId, ids.presentacionId, ids.ubicacionId, timestamp, timestamp))
    assert.throws(() => db.prepare('INSERT INTO ubicaciones (tipo, nombre, numero, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run('TAQUILLA', 'Sin número', null, timestamp, timestamp))
    assert.throws(() => db.prepare('INSERT INTO ubicaciones (tipo, nombre, numero, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run('PANOL', 'Inválido', 3, timestamp, timestamp))
  } finally {
    db.close()
  }
})

test('la migración 0002 conserva el stock creado por 0001', () => {
  const db = setup('0001_normalized_stock.sql')
  try {
    const grupoId = insertNamed(db, 'grupos', 'Analgésicos')
    const marcaId = insertNamed(db, 'marcas', 'Marca')
    const dosisId = insertNamed(db, 'dosis', '500 mg')
    const presentacionId = Number(db.prepare('INSERT INTO presentaciones (name, dosis_id, created_at, updated_at) VALUES (?, ?, ?, ?)').run('Comprimidos', dosisId, timestamp, timestamp).lastInsertRowid)
    const ubicacionId = Number(db.prepare('INSERT INTO ubicaciones (tipo, nombre, numero, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run('PANOL', 'Principal', null, timestamp, timestamp).lastInsertRowid)
    db.prepare('INSERT INTO drogas (name, cantidad, fecha_vencimiento, grupo_id, marca_id, presentacion_id, ubicacion_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run('Ibuprofeno', 12, '2029-01-01', grupoId, marcaId, presentacionId, ubicacionId, timestamp, timestamp)
    db.exec(fs.readFileSync(path.join(migrations, '0002_split_drugs_and_medications.sql'), 'utf8'))
    db.exec(fs.readFileSync(path.join(migrations, '0003_add_medication_name.sql'), 'utf8'))
    assert.equal(db.prepare('SELECT name FROM drogas').get()?.name, 'Ibuprofeno')
    assert.equal(db.prepare('SELECT cantidad FROM medicamentos').get()?.cantidad, 12)
    assert.equal(db.prepare('SELECT name FROM medicamentos').get()?.name, 'Ibuprofeno')
    assert.equal(db.prepare('SELECT cantidad FROM drogas_stock_legacy_0001').get()?.cantidad, 12)
  } finally {
    db.close()
  }
})

test('Zod valida los nuevos payloads', () => {
  assert.equal(namedEntityInputSchema.safeParse({ name: '' }).success, false)
  assert.equal(drogaInputSchema.safeParse({ name: 'Amoxicilina', grupoId: 1 }).success, true)
  assert.equal(drogaInputSchema.safeParse({ name: 'Amoxicilina', grupoId: 0 }).success, false)
  assert.equal(medicamentoInputSchema.safeParse({ name: 'Amoxidal', drogaId: 1, cantidad: 2, fechaVencimiento: '2028-01-01', marcaId: 1, presentacionId: 1, ubicacionId: 1 }).success, true)
  assert.equal(medicamentoInputSchema.safeParse({ name: '', drogaId: 1, cantidad: 2, fechaVencimiento: '2028-01-01', marcaId: 1, presentacionId: 1, ubicacionId: 1 }).success, false)
  assert.equal(medicamentoInputSchema.safeParse({ name: 'Amoxidal', drogaId: 1, cantidad: -1, fechaVencimiento: '2028-01-01', marcaId: 1, presentacionId: 1, ubicacionId: 1 }).success, false)
  assert.equal(presentacionInputSchema.safeParse({ name: 'Ampolla', dosisId: 0 }).success, false)
  assert.equal(ubicacionInputSchema.safeParse({ tipo: 'PANOL', nombre: 'A', numero: 3 }).success, false)
})

test('IPC devuelve el detalle del campo inválido', async () => {
  const result = await safeHandler(() => medicamentoInputSchema.parse({
    name: '', drogaId: 0, cantidad: -1, fechaVencimiento: 'fecha-inválida',
    marcaId: 1, presentacionId: 1, ubicacionId: 1
  }))
  assert.equal(result.ok, false)
  if (!result.ok) {
    assert.equal(result.error.code, 'VALIDATION_ERROR')
    assert.equal(result.error.details?.name, 'Este campo es obligatorio')
    assert.match(result.error.details?.cantidad ?? '', /negativa/)
    assert.match(result.error.message, /name/)
  }
})
