import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { DatabaseSync, type StatementSync } from 'node:sqlite'

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}

const defaultDirectory = process.env.APPDATA ? path.join(process.env.APPDATA, 'Sifal') : undefined
const databasePath = argument('--db') ?? (defaultDirectory ? path.join(defaultDirectory, 'stock.db') : undefined)

if (!databasePath) throw new Error('No se pudo determinar la base. Ejecutá el script con --db <ruta>.')

fs.mkdirSync(path.dirname(path.resolve(databasePath)), { recursive: true })
const db = new DatabaseSync(databasePath)
db.exec('PRAGMA journal_mode = WAL')
db.exec('PRAGMA foreign_keys = ON')

const migrationsDirectory = path.join(process.cwd(), 'src', 'main', 'database', 'migrations')

function migrate(): void {
  db.exec('CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)')
  const applied = new Set(db.prepare('SELECT name FROM _migrations').all().map((row) => (row as { name: string }).name))
  const files = fs.readdirSync(migrationsDirectory).filter((name) => name.endsWith('.sql')).sort()
  for (const file of files) {
    if (applied.has(file)) continue
    db.exec('BEGIN')
    try {
      db.exec(fs.readFileSync(path.join(migrationsDirectory, file), 'utf8'))
      db.prepare('INSERT INTO _migrations (name, applied_at) VALUES (?, ?)').run(file, new Date().toISOString())
      db.exec('COMMIT')
    } catch (error) {
      db.exec('ROLLBACK')
      throw error
    }
  }
}

function expirationMonth(offset: number): string {
  const date = new Date()
  date.setDate(1)
  date.setMonth(date.getMonth() + offset)
  return `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
}

try {
  migrate()

  const populatedTables = ['grupos', 'marcas', 'presentaciones', 'dosis', 'ubicaciones', 'drogas', 'medicamentos', 'biomedical_supplies']
    .filter((table) => (db.prepare(`SELECT COUNT(*) AS total FROM ${table}`).get() as { total: number }).total > 0)
  if (populatedTables.length) {
    throw new Error(`La base ya contiene datos (${populatedTables.join(', ')}). El cargador no modificó ningún registro.`)
  }

  const seed = () => {
    const timestamp = new Date().toISOString()
    const insertNamed = db.prepare('INSERT INTO grupos (name, created_at, updated_at) VALUES (?, ?, ?)')
    const insertBrand = db.prepare('INSERT INTO marcas (name, created_at, updated_at) VALUES (?, ?, ?)')
    const insertPresentation = db.prepare('INSERT INTO presentaciones (name, created_at, updated_at) VALUES (?, ?, ?)')
    const insertDose = db.prepare('INSERT INTO dosis (name, presentacion_id, created_at, updated_at) VALUES (?, ?, ?, ?)')
    const insertLocation = db.prepare('INSERT INTO ubicaciones (nombre, created_at, updated_at) VALUES (?, ?, ?)')
    const insertDrug = db.prepare('INSERT INTO drogas (name, grupo_id, created_at, updated_at) VALUES (?, ?, ?, ?)')
    const insertMedication = db.prepare('INSERT INTO medicamentos (droga_id, fecha_vencimiento, marca_id, presentacion_id, dosis_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    const insertMedicationStock = db.prepare('INSERT INTO medicamentos_stock (medicamento_id, ubicacion_id, cantidad) VALUES (?, ?, ?)')
    const insertSupply = db.prepare('INSERT INTO biomedical_supplies (name, expiration_date, created_at, updated_at) VALUES (?, ?, ?, ?)')
    const insertSupplyStock = db.prepare('INSERT INTO biomedical_supplies_stock (biomedical_supply_id, ubicacion_id, cantidad) VALUES (?, ?, ?)')

    const namedId = (statement: StatementSync, ...values: (string | number)[]) => Number(statement.run(...values).lastInsertRowid)
    const groups = {
      analgesics: namedId(insertNamed, 'Analgésicos', timestamp, timestamp),
      antibiotics: namedId(insertNamed, 'Antibióticos', timestamp, timestamp),
      antiinflammatories: namedId(insertNamed, 'Antiinflamatorios', timestamp, timestamp),
      gastro: namedId(insertNamed, 'Gastroprotectores', timestamp, timestamp),
      solutions: namedId(insertNamed, 'Soluciones parenterales', timestamp, timestamp),
      antiemetics: namedId(insertNamed, 'Antieméticos', timestamp, timestamp),
    }
    const brands = {
      bayer: namedId(insertBrand, 'Bayer', timestamp, timestamp),
      roemmers: namedId(insertBrand, 'Roemmers', timestamp, timestamp),
      bago: namedId(insertBrand, 'Bagó', timestamp, timestamp),
      pfizer: namedId(insertBrand, 'Pfizer', timestamp, timestamp),
      baxter: namedId(insertBrand, 'Baxter', timestamp, timestamp),
      generic: namedId(insertBrand, 'Genérico hospitalario', timestamp, timestamp),
    }
    const presentations = {
      tablets: namedId(insertPresentation, 'Comprimidos', timestamp, timestamp),
      capsules: namedId(insertPresentation, 'Cápsulas', timestamp, timestamp),
      bag: namedId(insertPresentation, 'Bolsa', timestamp, timestamp),
      ampoule: namedId(insertPresentation, 'Ampolla', timestamp, timestamp),
    }
    const doses = {
      tablet500: namedId(insertDose, '500 mg', presentations.tablets, timestamp, timestamp),
      tablet400: namedId(insertDose, '400 mg', presentations.tablets, timestamp, timestamp),
      capsule500: namedId(insertDose, '500 mg', presentations.capsules, timestamp, timestamp),
      capsule20: namedId(insertDose, '20 mg', presentations.capsules, timestamp, timestamp),
      bag500: namedId(insertDose, '500 ml', presentations.bag, timestamp, timestamp),
      ampoule10: namedId(insertDose, '10 mg/2 ml', presentations.ampoule, timestamp, timestamp),
    }
    const locations = {
      pharmacy: namedId(insertLocation, 'Farmacia central', timestamp, timestamp),
      guard: namedId(insertLocation, 'Guardia', timestamp, timestamp),
      operatingRoom: namedId(insertLocation, 'Quirófano', timestamp, timestamp),
      warehouse: namedId(insertLocation, 'Depósito general', timestamp, timestamp),
      contingency: namedId(insertLocation, 'Pañol de contingencia', timestamp, timestamp),
    }
    const drugs = {
      paracetamol: namedId(insertDrug, 'Paracetamol', groups.analgesics, timestamp, timestamp),
      amoxicillin: namedId(insertDrug, 'Amoxicilina', groups.antibiotics, timestamp, timestamp),
      ibuprofen: namedId(insertDrug, 'Ibuprofeno', groups.antiinflammatories, timestamp, timestamp),
      omeprazole: namedId(insertDrug, 'Omeprazol', groups.gastro, timestamp, timestamp),
      saline: namedId(insertDrug, 'Cloruro de sodio', groups.solutions, timestamp, timestamp),
      metoclopramide: namedId(insertDrug, 'Metoclopramida', groups.antiemetics, timestamp, timestamp),
    }

    const medication = (drug: number, expiration: string, brand: number, presentation: number, dose: number, stocks: Array<[number, number]>) => {
      const id = namedId(insertMedication, drug, expiration, brand, presentation, dose, timestamp, timestamp)
      for (const [location, quantity] of stocks) insertMedicationStock.run(id, location, quantity)
    }
    medication(drugs.paracetamol, expirationMonth(12), brands.bayer, presentations.tablets, doses.tablet500, [[locations.pharmacy, 90], [locations.guard, 25]])
    medication(drugs.paracetamol, expirationMonth(18), brands.generic, presentations.tablets, doses.tablet500, [[locations.pharmacy, 40], [locations.operatingRoom, 10]])
    medication(drugs.amoxicillin, expirationMonth(2), brands.roemmers, presentations.capsules, doses.capsule500, [[locations.pharmacy, 55], [locations.guard, 15]])
    medication(drugs.ibuprofen, expirationMonth(9), brands.pfizer, presentations.tablets, doses.tablet400, [])
    medication(drugs.omeprazole, expirationMonth(1), brands.bago, presentations.capsules, doses.capsule20, [[locations.pharmacy, 65], [locations.guard, 12]])
    medication(drugs.saline, expirationMonth(6), brands.baxter, presentations.bag, doses.bag500, [[locations.warehouse, 48], [locations.operatingRoom, 16], [locations.guard, 8]])
    medication(drugs.metoclopramide, expirationMonth(-1), brands.generic, presentations.ampoule, doses.ampoule10, [[locations.guard, 14]])

    const supply = (name: string, expiration: string, stocks: Array<[number, number]>) => {
      const id = namedId(insertSupply, name, expiration, timestamp, timestamp)
      for (const [location, quantity] of stocks) insertSupplyStock.run(id, location, quantity)
    }
    supply('Catéter intravenoso 20G', expirationMonth(20), [[locations.warehouse, 100], [locations.guard, 25]])
    supply('Jeringa descartable de 10 ml', expirationMonth(30), [[locations.warehouse, 200], [locations.guard, 50], [locations.operatingRoom, 30]])
    supply('Guantes quirúrgicos estériles talle M', expirationMonth(10), [[locations.warehouse, 80], [locations.operatingRoom, 40]])
    supply('Sonda Foley N.º 16', expirationMonth(14), [])
    supply('Equipo de venoclisis macrogotero', expirationMonth(1), [[locations.warehouse, 60], [locations.guard, 15], [locations.operatingRoom, 10]])
    supply('Apósito estéril 10 × 10 cm', expirationMonth(-2), [[locations.warehouse, 35], [locations.guard, 10]])
  }

  db.exec('BEGIN')
  try {
    seed()
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
  console.log(`Demo cargada correctamente en: ${path.resolve(databasePath)}`)
  console.log('Se crearon 5 ubicaciones, 6 drogas, 7 lotes de medicamentos y 6 biomédicos con distintos escenarios de stock y vencimiento.')
  console.log('Cerrá y volvé a abrir Sifal para ver los datos.')
} catch (error) {
  console.error(error instanceof Error ? error.message : 'No se pudo cargar la demo.')
  process.exitCode = 1
} finally {
  db.close()
}
