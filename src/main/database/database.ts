import fs from 'node:fs'
import path from 'node:path'
import { app } from 'electron'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

export type StockDatabase = ReturnType<typeof drizzle<typeof schema>>
let db: StockDatabase | undefined

function migrationDirectory(): string {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'migrations')
    : path.join(app.getAppPath(), 'src', 'main', 'database', 'migrations')
}

function runMigrations(sqlite: Database.Database): void {
  sqlite.exec('CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)')
  const applied = sqlite.prepare('SELECT name FROM _migrations').all().map((row) => (row as { name: string }).name)
  const files = fs.readdirSync(migrationDirectory()).filter((name) => name.endsWith('.sql')).sort()
  const apply = sqlite.transaction((name: string) => {
    sqlite.exec(fs.readFileSync(path.join(migrationDirectory(), name), 'utf8'))
    sqlite.prepare('INSERT INTO _migrations (name, applied_at) VALUES (?, ?)').run(name, new Date().toISOString())
  })
  for (const file of files) if (!applied.includes(file)) apply(file)
}

export function initializeDatabase(): StockDatabase {
  const sqlite = new Database(path.join(app.getPath('userData'), 'stock.db'))
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')
  runMigrations(sqlite)
  db = drizzle(sqlite, { schema })
  return db
}

export function getDatabase(): StockDatabase {
  if (!db) throw new Error('La base de datos no fue inicializada')
  return db
}
