import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import test from 'node:test'
import { drogaInputSchema, namedEntityInputSchema, presentacionInputSchema, ubicacionInputSchema } from '../src/shared/validation/schemas'

const timestamp = '2026-01-01T00:00:00.000Z'

function setup(): DatabaseSync {
  const db = new DatabaseSync(':memory:')
  db.exec('PRAGMA foreign_keys = ON')
  db.exec(fs.readFileSync(path.join(process.cwd(), 'src/main/database/migrations/0001_normalized_stock.sql'), 'utf8'))
  return db
}

function insertNamed(db: DatabaseSync, table: 'grupos' | 'marcas' | 'dosis', name: string): number {
  return Number(db.prepare(`INSERT INTO ${table} (name, created_at, updated_at) VALUES (?, ?, ?)`).run(name, timestamp, timestamp).lastInsertRowid)
}

test('la migración permite CRUD completo y relaciones válidas', () => {
  const db = setup()
  try {
    const grupoId = insertNamed(db, 'grupos', 'Analgésicos')
    const marcaId = insertNamed(db, 'marcas', 'Marca A')
    const dosisId = insertNamed(db, 'dosis', '500 mg')
    const presentacionId = Number(db.prepare('INSERT INTO presentaciones (name, dosis_id, created_at, updated_at) VALUES (?, ?, ?, ?)').run('Comprimidos', dosisId, timestamp, timestamp).lastInsertRowid)
    const taquillaId = Number(db.prepare('INSERT INTO ubicaciones (tipo, nombre, numero, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run('TAQUILLA', 'Enfermería', 4, timestamp, timestamp).lastInsertRowid)
    const panolId = Number(db.prepare('INSERT INTO ubicaciones (tipo, nombre, numero, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run('PANOL', 'Pañol sanitario', null, timestamp, timestamp).lastInsertRowid)
    const drogaId = Number(db.prepare('INSERT INTO drogas (name, cantidad, fecha_vencimiento, grupo_id, marca_id, presentacion_id, ubicacion_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run('Ibuprofeno', 20, '2028-06-30', grupoId, marcaId, presentacionId, taquillaId, timestamp, timestamp).lastInsertRowid)

    assert.equal(db.prepare('SELECT name FROM drogas WHERE id = ?').get(drogaId)?.name, 'Ibuprofeno')
    db.prepare('UPDATE grupos SET name = ? WHERE id = ?').run('Dolor', grupoId)
    db.prepare('UPDATE marcas SET name = ? WHERE id = ?').run('Marca B', marcaId)
    db.prepare('UPDATE dosis SET name = ? WHERE id = ?').run('1 g', dosisId)
    db.prepare('UPDATE presentaciones SET name = ? WHERE id = ?').run('Cápsulas', presentacionId)
    db.prepare('UPDATE ubicaciones SET nombre = ?, numero = ? WHERE id = ?').run('Guardia', 7, taquillaId)
    db.prepare('UPDATE drogas SET name = ?, ubicacion_id = ? WHERE id = ?').run('Ibuprofeno actualizado', panolId, drogaId)
    assert.equal(db.prepare('SELECT name FROM drogas WHERE id = ?').get(drogaId)?.name, 'Ibuprofeno actualizado')

    const extraGrupoId = insertNamed(db, 'grupos', 'Sin uso')
    db.prepare('DELETE FROM grupos WHERE id = ?').run(extraGrupoId)
    assert.equal(db.prepare('SELECT id FROM grupos WHERE id = ?').get(extraGrupoId), undefined)
    db.prepare('DELETE FROM drogas WHERE id = ?').run(drogaId)
    db.prepare('DELETE FROM ubicaciones WHERE id IN (?, ?)').run(taquillaId, panolId)
    db.prepare('DELETE FROM presentaciones WHERE id = ?').run(presentacionId)
    db.prepare('DELETE FROM dosis WHERE id = ?').run(dosisId)
    db.prepare('DELETE FROM marcas WHERE id = ?').run(marcaId)
    db.prepare('DELETE FROM grupos WHERE id = ?').run(grupoId)
  } finally {
    db.close()
  }
})

test('SQLite impide referencias rotas y estados inválidos', () => {
  const db = setup()
  try {
    const grupoId = insertNamed(db, 'grupos', 'Grupo')
    const marcaId = insertNamed(db, 'marcas', 'Marca')
    const dosisId = insertNamed(db, 'dosis', '20 mg/ml')
    const presentacionId = Number(db.prepare('INSERT INTO presentaciones (name, dosis_id, created_at, updated_at) VALUES (?, ?, ?, ?)').run('Jarabe', dosisId, timestamp, timestamp).lastInsertRowid)
    const ubicacionId = Number(db.prepare('INSERT INTO ubicaciones (tipo, nombre, numero, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run('PANOL', 'Principal', null, timestamp, timestamp).lastInsertRowid)
    assert.throws(() => db.prepare('INSERT INTO presentaciones (name, dosis_id, created_at, updated_at) VALUES (?, ?, ?, ?)').run('Ampolla', 999, timestamp, timestamp))
    assert.throws(() => db.prepare('INSERT INTO ubicaciones (tipo, nombre, numero, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run('TAQUILLA', 'Sin número', null, timestamp, timestamp))
    assert.throws(() => db.prepare('INSERT INTO ubicaciones (tipo, nombre, numero, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run('PANOL', 'Inválido', 3, timestamp, timestamp))
    assert.throws(() => db.prepare('INSERT INTO ubicaciones (tipo, nombre, numero, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run('OTRO', 'Inválido', null, timestamp, timestamp))
    assert.throws(() => db.prepare('INSERT INTO drogas (name, cantidad, fecha_vencimiento, grupo_id, marca_id, presentacion_id, ubicacion_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run('X', -1, '2028-01-01', grupoId, marcaId, presentacionId, ubicacionId, timestamp, timestamp))
    assert.throws(() => db.prepare('INSERT INTO drogas (name, cantidad, fecha_vencimiento, grupo_id, marca_id, presentacion_id, ubicacion_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run('X', 1, '2028-01-01', 999, marcaId, presentacionId, ubicacionId, timestamp, timestamp))

    db.prepare('INSERT INTO drogas (name, cantidad, fecha_vencimiento, grupo_id, marca_id, presentacion_id, ubicacion_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run('X', 1, '2028-01-01', grupoId, marcaId, presentacionId, ubicacionId, timestamp, timestamp)
    assert.throws(() => db.prepare('DELETE FROM grupos WHERE id = ?').run(grupoId))
    assert.throws(() => db.prepare('DELETE FROM marcas WHERE id = ?').run(marcaId))
    assert.throws(() => db.prepare('DELETE FROM presentaciones WHERE id = ?').run(presentacionId))
    assert.throws(() => db.prepare('DELETE FROM ubicaciones WHERE id = ?').run(ubicacionId))
    assert.throws(() => db.prepare('DELETE FROM dosis WHERE id = ?').run(dosisId))
  } finally {
    db.close()
  }
})

test('Zod rechaza payloads inválidos', () => {
  assert.equal(namedEntityInputSchema.safeParse({ name: '' }).success, false)
  assert.equal(presentacionInputSchema.safeParse({ name: 'Ampolla', dosisId: 0 }).success, false)
  assert.equal(drogaInputSchema.safeParse({ name: 'X', cantidad: -1, fechaVencimiento: '2028-01-01', grupoId: 1, marcaId: 1, presentacionId: 1, ubicacionId: 1 }).success, false)
  assert.equal(drogaInputSchema.safeParse({ name: 'X', cantidad: 1, fechaVencimiento: '2028-02-30', grupoId: 1, marcaId: 1, presentacionId: 1, ubicacionId: 1 }).success, false)
  assert.equal(ubicacionInputSchema.safeParse({ tipo: 'TAQUILLA', nombre: 'A' }).success, false)
  assert.equal(ubicacionInputSchema.safeParse({ tipo: 'DESCONOCIDA', nombre: 'A' }).success, false)
  assert.equal(ubicacionInputSchema.safeParse({ tipo: 'PANOL', nombre: 'A', numero: 3 }).success, false)
})
