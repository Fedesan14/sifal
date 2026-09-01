import fs from 'node:fs'
import path from 'node:path'
import { app } from 'electron'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'
import { setDatabase, type StockDatabase } from './connection'
export { getDatabase, type StockDatabase } from './connection'

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
  const database = drizzle(sqlite, { schema })
  setDatabase(database)
  return database
}
